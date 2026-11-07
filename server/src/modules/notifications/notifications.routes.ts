import { Router } from 'express';
import { NotificationsController } from './notifications.controller';

const router = Router();

// Real-time SSE stream endpoint
router.get('/stream', NotificationsController.stream);

// Recent notification history
router.get('/', NotificationsController.getRecent);

export default router;
