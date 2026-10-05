import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  getSecurityCenterStatus,
  logoutAllSessions
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Password Auth
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAllSessions);

// Security Center Telemetry (User-Specific)
router.get('/security-center', requireAuth, getSecurityCenterStatus);

// User Profile
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

// WebAuthn Passkeys (Passwordless)
router.post('/webauthn/generate-registration-options', requireAuth, generatePasskeyRegistrationOptions);
router.post('/webauthn/verify-registration', requireAuth, verifyPasskeyRegistration);
router.post('/webauthn/generate-authentication-options', generatePasskeyAuthenticationOptions);
router.post('/webauthn/verify-authentication', verifyPasskeyAuthentication);

export default router;
