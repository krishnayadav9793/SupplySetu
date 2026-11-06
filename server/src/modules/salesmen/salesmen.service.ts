import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config';

export interface CreateSalesmanInput {
  name: string;
  phone: string;
  password?: string;
  assignedRetailerIds?: string[];
}

export class SalesmenService {
  /**
   * List all beat salesmen with assigned shop count and orders count
   */
  static async listSalesmen() {
    const salesmen = await prisma.user.findMany({
      where: {
        role: Role.SALESMAN,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedRetailers: true,
            ordersPlaced: true,
          },
        },
        assignedRetailers: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            address: true,
            city: true,
            outstandingBalance: true,
          },
        },
      },
    });

    return salesmen.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      isActive: s.isActive,
      createdAt: s.createdAt,
      assignedShopsCount: s._count.assignedRetailers,
      ordersCount: s._count.ordersPlaced,
      shops: s.assignedRetailers,
    }));
  }

  /**
   * Create a new Beat Salesman and assign initial retail shops
   */
  static async createSalesman(input: CreateSalesmanInput) {
    const { name, phone, password = 'password123', assignedRetailerIds = [] } = input;

    if (!name || name.trim() === '') {
      throw new Error('Salesman name is required');
    }
    if (!phone || phone.trim().length < 10) {
      throw new Error('Valid 10-digit phone number is required');
    }

    const cleanPhone = phone.trim();

    // Check if phone already registered
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      throw new Error(`A user with phone number ${cleanPhone} already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const salesman = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          phone: cleanPhone,
          passwordHash,
          role: Role.SALESMAN,
          isActive: true,
        },
      });

      // Assign shops if any provided
      if (assignedRetailerIds.length > 0) {
        await tx.retailer.updateMany({
          where: { id: { in: assignedRetailerIds } },
          data: { salesmanId: user.id },
        });
      }

      return user;
    });

    return {
      id: salesman.id,
      name: salesman.name,
      phone: salesman.phone,
      role: salesman.role,
      isActive: salesman.isActive,
      createdAt: salesman.createdAt,
    };
  }

  /**
   * Assign or transfer kirana shops to a salesman
   */
  static async assignShops(salesmanId: string, retailerIds: string[]) {
    const salesman = await prisma.user.findUnique({
      where: { id: salesmanId, role: Role.SALESMAN },
    });

    if (!salesman) {
      throw new Error('Salesman not found');
    }

    await prisma.retailer.updateMany({
      where: { id: { in: retailerIds } },
      data: { salesmanId },
    });

    return { success: true, count: retailerIds.length };
  }
}
