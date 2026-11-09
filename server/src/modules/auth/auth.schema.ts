import { z } from 'zod';
import { Role, PriceTier } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number and name are required' })
      .min(1, 'Phone number and name are required'),
    name: z
      .string({ required_error: 'Phone number and name are required' })
      .min(1, 'Phone number and name are required'),
    password: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    shopName: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstNumber: z.string().optional(),
    priceTier: z.nativeEnum(PriceTier).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(1, 'Phone number is required'),
    password: z.string().optional(),
  }),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>['body'];
export type LoginSchemaInput = z.infer<typeof loginSchema>['body'];
