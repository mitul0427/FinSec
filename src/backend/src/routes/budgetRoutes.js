import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyHmacSignature } from '../middleware/security.js';

import prisma from '../config/prisma.js';
import { ensureOwnership } from '../middleware/ownership.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', verifyHmacSignature, setBudget);
router.delete('/:id', verifyHmacSignature, ensureOwnership(prisma.budget, 'id', 'userId'), deleteBudget);

export default router;
