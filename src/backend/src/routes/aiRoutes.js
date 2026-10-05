import { Router } from 'express';
import { handleAiQuery, confirmAiAction } from '../controllers/aiAssistantController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/assistant', handleAiQuery);
router.post('/action/confirm', confirmAiAction);

export default router;
