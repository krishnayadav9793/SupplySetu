import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    retailerId: z.string().optional(),
    salesmanId: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string({ required_error: 'productId is required' }),
          quantity: z.number().int().positive('quantity must be a positive integer'),
        })
      )
      .min(1, 'Order must contain at least one product item'),
    notes: z.string().optional(),
    createdVia: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z
    .object({
      notes: z.string().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

export type CreateOrderSchemaInput = z.infer<typeof createOrderSchema>['body'];
