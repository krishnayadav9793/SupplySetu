import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma, config } from '../../config';
import { AuthUser } from '../../middleware/auth';

export class AuthService {
  static async login(phone: string, password?: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        retailerProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found with this phone number');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive. Please contact your distributor.');
    }

    // If password is provided, verify it (otherwise if password123 or demo mode)
    if (password) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid && password !== 'password123') {
        throw new Error('Invalid credentials');
      }
    }

    const payload: AuthUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d',
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        retailer: user.retailerProfile || null,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        retailerProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      retailer: user.retailerProfile || null,
    };
  }

  static async getDemoAccounts() {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        retailerProfile: {
          select: {
            shopName: true,
            city: true,
            creditLimit: true,
            outstandingBalance: true,
          },
        },
      },
    });

    return users;
  }
}
