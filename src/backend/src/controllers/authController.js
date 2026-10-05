import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../config/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth.js';

const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = process.env.RP_NAME || 'FinSec ZeroTrust';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'finsec_super_secret_jwt_refresh_token_key_2026_abc_secure';

// Helper to set HttpOnly refresh cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('finsec_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// 1. Password Registration
export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Allow setting role to ADMIN if specified or first user
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        fullName: fullName || email.split('@')[0],
        passwordHash,
        role: assignedRole
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      message: 'User registered successfully with Zero Trust credentials.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      accessToken
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed.', details: err.message });
  }
};

// 2. Password Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials or user registered via Passkey only.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      message: 'Authenticated successfully.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        customGeminiKey: !!user.customGeminiKey
      },
      accessToken
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed.', details: err.message });
  }
};

// 3. Refresh Access Token (Rotating HttpOnly Cookie)
export const refreshToken = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies?.finsec_refresh_token;
    if (!currentRefreshToken) {
      return res.status(401).json({ error: 'Missing refresh token cookie.' });
    }

    const decoded = jwt.verify(currentRefreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token expired or invalid.' });
  }
};

// 4. Logout
export const logout = (req, res) => {
  res.clearCookie('finsec_refresh_token');
  return res.json({ message: 'Session logged out and refresh cookie cleared.' });
};

// 5. Get / Update Profile
export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      customGeminiKey: true,
      createdAt: true
    }
  });
  return res.json({ user });
};

export const updateProfile = async (req, res) => {
  const { fullName, customGeminiKey } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      fullName: fullName !== undefined ? fullName : undefined,
      customGeminiKey: customGeminiKey !== undefined ? customGeminiKey : undefined
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      customGeminiKey: true
    }
  });
  return res.json({ message: 'Profile updated successfully.', user });
};

// ==========================================
// WebAuthn Passkeys Implementation
// ==========================================

// WebAuthn Step 1: Generate Registration Options
export const generatePasskeyRegistrationOptions = async (req, res) => {
  try {
    const user = req.user;
    const existingPasskeys = await prisma.passkeyCredential.findMany({
      where: { userId: user.id }
    });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(user.id, 'utf-8'),
      userName: user.email,
      userDisplayName: user.fullName || user.email,
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map((p) => ({
        id: p.id,
        transports: p.transports ? JSON.parse(p.transports) : undefined
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    // Save ephemeral challenge to user record
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    });

    return res.json(options);
  } catch (err) {
    console.error('Passkey registration options error:', err);
    return res.status(500).json({ error: 'Failed to generate passkey options.', details: err.message });
  }
};

// WebAuthn Step 2: Verify Registration Response
export const verifyPasskeyRegistration = async (req, res) => {
  try {
    const user = req.user;
    const response = req.body;

    if (!user.currentChallenge) {
      return res.status(400).json({ error: 'No active passkey registration challenge found.' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Passkey registration verification failed.' });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Convert public key to Base64 for storage
    const base64PublicKey = Buffer.from(credential.publicKey).toString('base64');

    await prisma.passkeyCredential.create({
      data: {
        id: credential.id,
        userId: user.id,
        publicKey: base64PublicKey,
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response.transports ? JSON.stringify(response.response.transports) : null
      }
    });

    // Clear challenge
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: null }
    });

    return res.json({ verified: true, message: 'Passkey enrolled successfully!' });
  } catch (err) {
    console.error('Passkey verify error:', err);
    return res.status(400).json({ error: 'Failed to verify passkey.', details: err.message });
  }
};

// WebAuthn Step 3: Generate Authentication Options (Login)
export const generatePasskeyAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;
    let allowCredentials = undefined;
    let user = null;

    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const credentials = await prisma.passkeyCredential.findMany({
          where: { userId: user.id }
        });
        allowCredentials = credentials.map((c) => ({
          id: c.id,
          transports: c.transports ? JSON.parse(c.transports) : undefined
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials
    });

    // Store challenge if user exists, or return with challenge in payload
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: options.challenge }
      });
    }

    return res.json({ options, challenge: options.challenge });
  } catch (err) {
    console.error('Passkey auth options error:', err);
    return res.status(500).json({ error: 'Failed to generate authentication challenge.' });
  }
};

// WebAuthn Step 4: Verify Authentication Response (Login)
export const verifyPasskeyAuthentication = async (req, res) => {
  try {
    const { response, email, challenge } = req.body;
    const credentialId = response.id;

    const passkey = await prisma.passkeyCredential.findUnique({
      where: { id: credentialId },
      include: { user: true }
    });

    if (!passkey) {
      return res.status(400).json({ error: 'Passkey not recognized.' });
    }

    const expectedChallenge = passkey.user.currentChallenge || challenge;
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Missing expected challenge.' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.id,
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: Number(passkey.counter),
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined
      }
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'WebAuthn biometric verification failed.' });
    }

    // Update counter
    await prisma.passkeyCredential.update({
      where: { id: passkey.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) }
    });

    // Clear challenge
    await prisma.user.update({
      where: { id: passkey.userId },
      data: { currentChallenge: null }
    });

    const accessToken = generateAccessToken(passkey.user);
    const refreshToken = generateRefreshToken(passkey.user);
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      verified: true,
      message: 'Authenticated with Passkey.',
      user: {
        id: passkey.user.id,
        email: passkey.user.email,
        fullName: passkey.user.fullName,
        role: passkey.user.role
      },
      accessToken
    });
  } catch (err) {
    console.error('Passkey authentication verification error:', err);
    return res.status(400).json({ error: 'Passkey verification failed.', details: err.message });
  }
};
