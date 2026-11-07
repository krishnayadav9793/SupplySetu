import { Router } from 'express';
import { AiOrderCaptureController } from './ai.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Diagnostic check of Gemini AI configuration and model availability
router.get('/status', AiOrderCaptureController.getStatus);

// Process natural language text order message through AI (WhatsApp/SMS)
router.post('/order-capture', optionalAuthenticate, AiOrderCaptureController.captureOrder);

// Process multimodal order (handwritten Parchi photo, bill scan, voice audio notes)
router.post('/order-capture-multimodal', optionalAuthenticate, AiOrderCaptureController.captureMultimodalOrder);

// Provide preset sample Kirana WhatsApp prompts for quick demonstration
router.get('/samples', AiOrderCaptureController.getSamplePrompts);

export default router;
