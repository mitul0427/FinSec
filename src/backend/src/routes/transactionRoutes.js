import { Router } from 'express';
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyHmacSignature } from '../middleware/security.js';

const router = Router();

// Apply auth to all transaction endpoints
router.use(requireAuth);

// Data Export (GET /api/v1/transactions/export?format=csv|json)
router.get('/export', exportTransactions);

// Summary metrics
router.get('/summary', getSummary);

// CRUD
router.get('/', getTransactions);
router.post('/', verifyHmacSignature, createTransaction);
router.put('/:id', verifyHmacSignature, updateTransaction);
router.delete('/:id', verifyHmacSignature, deleteTransaction);

export default router;
