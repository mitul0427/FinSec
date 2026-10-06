import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finsec_super_secret_jwt_access_token_key_2026_xyz_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'finsec_super_secret_jwt_refresh_token_key_2026_abc_secure';

// Helper to generate 5-minute access token
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '5m' } // Ephemeral 5-minute expiry
  );
};

// Helper to generate 7-day refresh token
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication Middleware: Verifies Bearer JWT
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Bearer token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'The token belongs to a user that no longer exists.'
      });
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Access token expired (5-min lifetime). Please refresh your session.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Cryptographic signature verification failed for access token.'
    });
  }
};

// Role-Based Access Control (RBAC): Admin only guard
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'FORBIDDEN_INSUFFICIENT_PRIVILEGES',
      message: 'Access Restricted: You must hold an ADMIN role to access this SOC resource.'
    });
  }
  next();
};
