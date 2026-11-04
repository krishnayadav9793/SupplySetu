import { Router } from 'express';
import { AiOrderCaptureController } from './ai.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Process raw voice/text order message through AI
router.post('/order-capture', optionalAuthenticate, AiOrderCaptureController.captureOrder);

// Provide preset sample Kirana WhatsApp prompts for quick demonstration
router.get('/samples', AiOrderCaptureController.getSamplePrompts);

export default router;
