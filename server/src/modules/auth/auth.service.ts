import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, PriceTier } from '@prisma/client';
import { prisma, config } from '../../config';
import { AuthUser } from '../../middleware/auth';

export interface RegisterInput {
  phone: string;
  password?: string;
  name: string;
  role?: Role;
  shopName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  priceTier?: PriceTier;
}

export class AuthService {
  static async register(input: RegisterInput) {
    const {
      phone,
      password = 'password123',
      name,
      role = Role.RETAILER,
      shopName,
      address,
      city = 'Jabalpur',
      state = 'Madhya Pradesh',
      pincode,
      gstNumber,
      priceTier = PriceTier.STANDARD,
    } = input;

    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required');
    }
    if (!name || name.trim() === '') {
      throw new Error('Name is required');
    }

    // Check if phone already registered
    const existing = await prisma.user.findUnique({
      where: { phone: phone.trim() },
    });

    if (existing) {
      throw new Error('A user with this mobile number already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and retailer in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: phone.trim(),
          name: name.trim(),
          passwordHash,
          role,
          isActive: true,
        },
      });

      if (role === Role.RETAILER) {
        await tx.retailer.create({
          data: {
            userId: user.id,
            shopName: shopName?.trim() || `${name.trim()}'s Kirana Store`,
            ownerName: name.trim(),
            phone: phone.trim(),
            address: address?.trim() || 'Lordganj Market, Jabalpur',
            city: city.trim(),
            state: state.trim(),
            pincode: pincode?.trim() || '482002',
            gstNumber: gstNumber?.trim() || null,
            creditLimit: 50000.0,
            outstandingBalance: 0.0,
            priceTier,
            isActive: true,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: { retailerProfile: true },
      });
    });

    if (!newUser) {
      throw new Error('Failed to create account');
    }

    const payload: AuthUser = {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      role: newUser.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d',
    });

    return {
      token,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        role: newUser.role,
        retailer: newUser.retailerProfile || null,
      },
    };
  }

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
