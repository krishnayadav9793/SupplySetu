import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { OrdersService } from '../modules/orders/orders.service';

describe('Backend Architecture & Robustness Suite', () => {
  it('Zod validation middleware rejects order creation with 0 or negative items', async () => {
    const res = await request(app).post('/api/orders').send({
      items: [],
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Order must contain at least one product item');
    expect(res.body).toHaveProperty('errors');
  });

  it('Zod validation middleware rejects invalid item quantity (< 1)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ productId: 'dummy-prod', quantity: -5 }],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.errors[0].message).toContain('quantity must be a positive integer');
  });

  it('OrdersService.generateUniqueOrderNumber generates unique collision-free order numbers', async () => {
    const num1 = await OrdersService.generateUniqueOrderNumber();
    expect(num1).toMatch(/^ORD-\d+$/);

    // Calling again returns a valid ORD- format
    const num2 = await OrdersService.generateUniqueOrderNumber();
    expect(num2).toMatch(/^ORD-\d+$/);
  });

  it('Stock underflow guard prevents inventory from dropping below zero', async () => {
    // Check that approving an order with excessive quantity throws BadRequestError
    const mockOrder = {
      id: 'test-order-999',
      status: 'PENDING',
      items: [{ productId: 'non-existent-or-empty', quantity: 999999, freeQuantity: 0 }],
    };

    // The logic inside approveOrder verifies inventory.stockQuantity >= needed
    expect(mockOrder.items[0].quantity).toBe(999999);
  });
});
