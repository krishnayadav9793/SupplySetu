import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, PriceTier } from '@prisma/client';
import { prisma, config } from '../../config';
import { AuthUser } from '../../middleware/auth';

export interface RegisterInput {
  phone: string;
  password: string;
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
      password,
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
    if (!password || password.trim().length < 6) {
      throw new Error('Password is required and must be at least 6 characters');
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
    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required');
    }
    if (!password || password.trim() === '') {
      throw new Error('Password is required');
    }

    const user = await prisma.user.findUnique({
      where: { phone: phone.trim() },
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

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
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

    const isDefaultPassword = await bcrypt.compare('password123', user.passwordHash);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        retailer: user.retailerProfile || null,
        needsPasswordChange: isDefaultPassword,
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

    const isDefaultPassword = await bcrypt.compare('password123', user.passwordHash);

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      retailer: user.retailerProfile || null,
      needsPasswordChange: isDefaultPassword,
    };
  }

  static async changePassword(userId: string, newPassword: string, currentPassword?: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (currentPassword && currentPassword.trim() !== '') {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Current password does not match');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  static async resetPassword(phone: string, newPassword: string) {
    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required');
    }
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const cleanPhone = phone.trim();
    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      throw new Error('No user account found with this phone number');
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: 'Password updated successfully. Please log in with your new credentials.',
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
