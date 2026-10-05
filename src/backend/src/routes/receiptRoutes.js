import { Router } from 'express';
import multer from 'multer';
import { scanReceipt } from '../controllers/receiptController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Store files in memory so we can validate magic bytes and strip metadata before persisting
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(requireAuth);

router.post('/scan', upload.single('receipt'), scanReceipt);

export default router;
