import { Request, Response } from 'express';
import { eventBus, LiveNotificationEvent } from './events';

export class NotificationsController {
  /**
   * Server-Sent Events (SSE) stream for real-time order alerts & live updates
   */
  static stream(req: Request, res: Response): void {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for NGINX/proxies
    });

    // Send initial connection handshake
    res.write(
      `data: ${JSON.stringify({ type: 'CONNECTED', message: 'SupplySetu Real-Time Live Notification Stream Connected' })}\n\n`
    );

    // Listen to live events and forward to this client
    const onNotification = (event: LiveNotificationEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    eventBus.on('notification', onNotification);

    // Keep-alive heartbeat every 20 seconds to prevent proxy timeouts
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 20000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      eventBus.off('notification', onNotification);
      res.end();
    });
  }

  /**
   * Get recent notifications history (for dropdown in header)
   */
  static getRecent(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: eventBus.getRecent(),
    });
  }
}
