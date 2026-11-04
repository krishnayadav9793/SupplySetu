import { PriceTier, Prisma } from '@prisma/client';
import { prisma } from '../../config';

export interface RetailerQueryParams {
  search?: string;
  priceTier?: PriceTier;
  salesmanId?: string;
  page?: number;
  limit?: number;
}

export class RetailersService {
  /**
   * Get current logged-in retailer profile by userId
   */
  static async getRetailerByUserId(userId: string) {
    const retailer = await prisma.retailer.findUnique({
      where: { userId },
      include: {
        salesman: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!retailer) {
      throw new Error('Retailer profile not found for this user');
    }

    const availableCredit = Math.max(0, retailer.creditLimit - retailer.outstandingBalance);
    const creditUtilization = retailer.creditLimit > 0
      ? Math.round((retailer.outstandingBalance / retailer.creditLimit) * 100)
      : 0;

    return {
      ...retailer,
      availableCredit,
      creditUtilization,
    };
  }

  /**
   * Get single retailer by retailer ID
   */
  static async getRetailerById(id: string) {
    const retailer = await prisma.retailer.findUnique({
      where: { id },
      include: {
        salesman: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            finalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!retailer) {
      throw new Error(`Retailer with ID ${id} not found`);
    }

    const availableCredit = Math.max(0, retailer.creditLimit - retailer.outstandingBalance);
    const creditUtilization = retailer.creditLimit > 0
      ? Math.round((retailer.outstandingBalance / retailer.creditLimit) * 100)
      : 0;

    return {
      ...retailer,
      availableCredit,
      creditUtilization,
    };
  }

  /**
   * List retailers with search & pagination (Admin/Salesman)
   */
  static async listRetailers(params: RetailerQueryParams) {
    const { search, priceTier, salesmanId, page = 1, limit = 50 } = params;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: Prisma.RetailerWhereInput = {
      isActive: true,
    };

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { shopName: { contains: term, mode: 'insensitive' } },
        { ownerName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (priceTier) {
      where.priceTier = priceTier;
    }

    if (salesmanId) {
      where.salesmanId = salesmanId;
    }

    const [retailers, totalCount] = await Promise.all([
      prisma.retailer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { shopName: 'asc' },
        include: {
          salesman: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.retailer.count({ where }),
    ]);

    const formatted = retailers.map((r) => {
      const availableCredit = Math.max(0, r.creditLimit - r.outstandingBalance);
      const creditUtilization = r.creditLimit > 0
        ? Math.round((r.outstandingBalance / r.creditLimit) * 100)
        : 0;

      return {
        id: r.id,
        userId: r.userId,
        shopName: r.shopName,
        ownerName: r.ownerName,
        phone: r.phone,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        gstNumber: r.gstNumber,
        creditLimit: r.creditLimit,
        outstandingBalance: r.outstandingBalance,
        availableCredit,
        creditUtilization,
        priceTier: r.priceTier,
        salesman: r.salesman,
        totalOrdersCount: r._count.orders,
      };
    });

    return {
      retailers: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Update retailer info (PriceTier, CreditLimit, etc.)
   */
  static async updateRetailer(
    id: string,
    data: {
      shopName?: string;
      ownerName?: string;
      phone?: string;
      address?: string;
      city?: string;
      pincode?: string;
      gstNumber?: string;
      creditLimit?: number;
      priceTier?: PriceTier;
      salesmanId?: string;
    }
  ) {
    const updated = await prisma.retailer.update({
      where: { id },
      data,
    });
    return updated;
  }
}
