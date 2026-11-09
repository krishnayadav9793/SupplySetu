import { z } from 'zod';
import { Role, PriceTier } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number and name are required' })
      .min(10, 'Valid 10-digit phone number is required'),
    name: z
      .string({ required_error: 'Phone number and name are required' })
      .min(1, 'Name is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
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
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(10, 'Valid 10-digit phone number is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
    currentPassword: z.string().optional(),
  }),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>['body'];
export type LoginSchemaInput = z.infer<typeof loginSchema>['body'];
export type ResetPasswordSchemaInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordSchemaInput = z.infer<typeof changePasswordSchema>['body'];
