import dotenv from 'dotenv';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('supplysetu_development_secret_key_change_in_production'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

const env = parsedEnv.data;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.includes('development_secret')) {
  console.warn(
    '⚠️ [Security Warning]: Using default fallback JWT_SECRET in production is highly insecure!'
  );
}

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  clientUrl: env.CLIENT_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: '7d',
  databaseUrl: env.DATABASE_URL,
  geminiApiKey: env.GEMINI_API_KEY,
};

// Singleton Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
