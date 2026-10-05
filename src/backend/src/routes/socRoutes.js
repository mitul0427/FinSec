import { Router } from 'express';
import {
  handleHoneypot,
  getSecurityLogs,
  getSocStats,
  simulateAttack
} from '../controllers/socController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ==========================================
// Honeypot Decoy Trap (Unauthenticated lure)
// POST /api/v1/admin/login-v1
// ==========================================
router.post('/login-v1', handleHoneypot);

// ==========================================
// SOC Administration Endpoints (ADMIN Role Only)
// ==========================================
router.get('/logs', requireAuth, requireAdmin, getSecurityLogs);
router.get('/stats', requireAuth, requireAdmin, getSocStats);
router.post('/simulate-attack', requireAuth, requireAdmin, simulateAttack);

export default router;
