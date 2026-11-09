import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { config, prisma } from './config';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter';
import { AppError } from './utils/errors';
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

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        config.nodeEnv !== 'production' ||
        origin === config.clientUrl ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting
app.use('/api', generalLimiter);

// API Routes with specialized limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/salesmen', salesmenRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Deep Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = `disconnected: ${err?.message || 'unknown error'}`;
  }

  const isHealthy = dbStatus === 'ok';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'SupplySetu Backend API',
    environment: config.nodeEnv,
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Safe Global Error Handler (prevents stack/internal leakage in production)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Server Error] [${req.method} ${req.originalUrl}]:`, err);

  // Operational application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Zod schema validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  // Malformed JSON error
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body',
    });
    return;
  }

  // Internal or generic errors
  const isProd = config.nodeEnv === 'production';
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message =
    isProd && statusCode === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// Start Server & Handle Graceful Shutdown
if (config.nodeEnv !== 'test' && !process.env.VITEST) {
  const server = app.listen(config.port, () => {
    console.log(`[SupplySetu Server] running on http://localhost:${config.port}`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`[SupplySetu] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[SupplySetu] HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('[SupplySetu] Database connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('[SupplySetu] Error disconnecting database:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('[SupplySetu] Forced termination: graceful shutdown timed out.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;
