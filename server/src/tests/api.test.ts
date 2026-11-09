import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Express REST API Endpoints Integration', () => {
  it('GET /api/health returns service status and uptime', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('service', 'SupplySetu Backend API');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/unknown-route returns 404 with structured JSON message', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Route GET /api/unknown-route not found');
  });

  it('POST /api/auth/login rejects empty payload with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Phone number is required');
  });

  it('POST /api/auth/register rejects missing phone and name with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'secretpassword' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Phone number and name are required');
  });

  it('GET /api/auth/me without auth token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('No token provided');
  });
});
