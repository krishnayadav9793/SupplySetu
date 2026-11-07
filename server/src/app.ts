import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/products.routes';
import retailerRoutes from './modules/retailers/retailers.routes';
import aiRoutes from './modules/ai/ai.routes';
import orderRoutes from './modules/orders/orders.routes';
import exportRoutes from './modules/exports/exports.routes';
import salesmenRoutes from './modules/salesmen/salesmen.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/salesmen', salesmenRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SupplySetu Backend API',
    environment: config.nodeEnv,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    console.log(`[SupplySetu Server] running on http://localhost:${config.port}`);
  });
}

export default app;
