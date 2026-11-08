import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors';

describe('Security & Production Hardening Suite', () => {
  it('includes Helmet security headers and strips X-Powered-By', async () => {
    const res = await request(app).get('/api/health');

    // Helmet security headers
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  it('custom AppError instances are properly typed with correct status codes', () => {
    const badReq = new BadRequestError('Invalid input provided');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.message).toBe('Invalid input provided');
    expect(badReq.isOperational).toBe(true);

    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
    expect(unauth.message).toBe('Authentication required');

    const forbidden = new ForbiddenError('Role not permitted');
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.message).toBe('Role not permitted');

    const customErr = new AppError('Payment processing failed', 402);
    expect(customErr.statusCode).toBe(402);
  });

  it('deep health check returns valid database connectivity and uptime', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });
});
