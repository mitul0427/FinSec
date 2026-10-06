import { Router } from 'express';
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  verifyLedger,
  getTransactionAnomalies
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyHmacSignature } from '../middleware/security.js';

import prisma from '../config/prisma.js';
import { ensureOwnership } from '../middleware/ownership.js';

const router = Router();

// Apply auth to all transaction endpoints
router.use(requireAuth);

// Anomaly Detection (GET /api/v1/transactions/anomalies)
router.get('/anomalies', getTransactionAnomalies);

// Cryptographic Ledger Verification (GET /api/v1/transactions/ledger/verify)
router.get('/ledger/verify', verifyLedger);

// Data Export (GET /api/v1/transactions/export?format=csv|json)
router.get('/export', exportTransactions);

// Summary metrics
router.get('/summary', getSummary);

// CRUD with IDOR Protection
router.get('/', getTransactions);
router.post('/', verifyHmacSignature, createTransaction);
router.put('/:id', verifyHmacSignature, ensureOwnership(prisma.transaction, 'id', 'userId'), updateTransaction);
router.delete('/:id', verifyHmacSignature, ensureOwnership(prisma.transaction, 'id', 'userId'), deleteTransaction);

export default router;
