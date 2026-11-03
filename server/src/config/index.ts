import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'supplysetu_development_secret_key_change_in_production',
  jwtExpiresIn: '7d',
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
