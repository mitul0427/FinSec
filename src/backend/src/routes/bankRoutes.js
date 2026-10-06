import { Router } from 'express';
import {
  handleBankWebhookTransaction,
  approveTransaction,
  blockTransaction
} from '../controllers/bankWebhookController.js';
import { requireAuth } from '../middleware/auth.js';
import { webhookRateLimiter } from '../middleware/security.js';

const router = Router();

// Simulated Bank Webhook Ingress (Rate limited)
router.post('/webhook/transaction', webhookRateLimiter, handleBankWebhookTransaction);

// User confirmation actions (Require Auth + IDOR check)
router.post('/transaction/:id/approve', requireAuth, approveTransaction);
router.post('/transaction/:id/block', requireAuth, blockTransaction);

export default router;
