import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyHmacSignature } from '../middleware/security.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', verifyHmacSignature, setBudget);
router.delete('/:id', verifyHmacSignature, deleteBudget);

export default router;
