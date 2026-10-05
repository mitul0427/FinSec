import { Router } from 'express';
import { handleAiQuery } from '../controllers/aiAssistantController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/assistant', handleAiQuery);

export default router;
