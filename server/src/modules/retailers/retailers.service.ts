import { PriceTier, Prisma } from '@prisma/client';
import { prisma } from '../../config';

interface InKhataPaymentRecord {
  id: string;
  retailerId: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  notes?: string;
  createdAt: Date;
}

const recordedPaymentsStore: InKhataPaymentRecord[] = [];

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
    const creditUtilization =
      retailer.creditLimit > 0
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
    const creditUtilization =
      retailer.creditLimit > 0
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
      // If salesman has specific retailers assigned, filter by them;
      // otherwise show all active retailers in territory so salesman can visit any beat shop
      const assignedCount = await prisma.retailer.count({ where: { salesmanId, isActive: true } });
      if (assignedCount > 0) {
        where.salesmanId = salesmanId;
      }
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
      const creditUtilization =
        r.creditLimit > 0 ? Math.round((r.outstandingBalance / r.creditLimit) * 100) : 0;

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

  /**
   * Get Retailer Khata Ledger & Passbook Statement
   */
  static async getKhataLedger(retailerId: string) {
    const retailer = await prisma.retailer.findUnique({
      where: { id: retailerId },
      include: {
        salesman: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, skuCode: true },
                },
              },
            },
          },
        },
      },
    });

    if (!retailer) {
      throw new Error(`Retailer ${retailerId} not found`);
    }

    const creditLimit = retailer.creditLimit;
    const outstandingBalance = retailer.outstandingBalance;
    const availableCredit = Math.max(0, creditLimit - outstandingBalance);
    const creditUtilization =
      creditLimit > 0 ? Math.round((outstandingBalance / creditLimit) * 100) : 0;

    let creditStatus: 'HEALTHY' | 'WARNING' | 'OVERDUE_HOLD' = 'HEALTHY';
    if (outstandingBalance > creditLimit) {
      creditStatus = 'OVERDUE_HOLD';
    } else if (creditUtilization >= 80) {
      creditStatus = 'WARNING';
    }

    // Generate Ledger Entries
    // Each order is an Invoice (DEBIT to Kirana Khata)
    const transactions: Array<{
      id: string;
      date: string;
      type: 'INVOICE' | 'PAYMENT';
      referenceNo: string;
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
      paymentMode?: string;
      orderId?: string;
      status: string;
    }> = [];

    // Order from oldest to newest to compute running balance
    const chronOrders = [...retailer.orders].reverse();
    let currentBalance = 0;

    for (const ord of chronOrders) {
      if (ord.status === 'REJECTED') continue;

      currentBalance += ord.finalAmount;
      transactions.push({
        id: `txn-inv-${ord.id}`,
        date: ord.createdAt.toISOString(),
        type: 'INVOICE',
        referenceNo: ord.orderNumber,
        description: `B2B Supply Invoice (${ord.items.length} items) - Jabalpur Warehouse`,
        debit: ord.finalAmount,
        credit: 0,
        runningBalance: Math.round(currentBalance * 100) / 100,
        orderId: ord.id,
        status: ord.status,
      });

      // If approved or delivered and balance was partially settled, add demo settlement entry
      if (ord.status === 'DELIVERED' || ord.status === 'APPROVED') {
        const settlementAmount = Math.round(ord.finalAmount * 0.7 * 100) / 100;
        if (currentBalance >= settlementAmount) {
          currentBalance -= settlementAmount;
          const payDate = new Date(ord.createdAt.getTime() + 1000 * 60 * 60 * 24 * 3);
          transactions.push({
            id: `txn-pay-${ord.id}`,
            date: payDate.toISOString(),
            type: 'PAYMENT',
            referenceNo: `UPI-SETTLE-${ord.orderNumber.replace('ORD-', '')}`,
            description: `UPI Khata Repayment via ${retailer.salesman?.name || 'Salesman'}`,
            debit: 0,
            credit: settlementAmount,
            runningBalance: Math.round(currentBalance * 100) / 100,
            paymentMode: 'UPI_DIRECT',
            status: 'SETTLED',
          });
        }
      }
    }

    // Add user-recorded payments in real-time
    const relevantPayments = recordedPaymentsStore.filter((p) => p.retailerId === retailerId);
    for (const p of relevantPayments) {
      currentBalance = Math.max(0, currentBalance - p.amount);
      transactions.push({
        id: p.id,
        date: p.createdAt.toISOString(),
        type: 'PAYMENT',
        referenceNo: p.referenceNo,
        description: p.notes || `UPI Khata Repayment via Instant Settlement`,
        debit: 0,
        credit: p.amount,
        runningBalance: Math.round(currentBalance * 100) / 100,
        paymentMode: p.paymentMode,
        status: 'SETTLED',
      });
    }

    // Sort transactions so newest appears at the top
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      retailer: {
        id: retailer.id,
        shopName: retailer.shopName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        city: retailer.city,
        state: retailer.state,
        gstNumber: retailer.gstNumber,
        priceTier: retailer.priceTier,
        creditLimit,
        outstandingBalance,
        availableCredit,
        creditUtilization,
        creditStatus,
        salesman: retailer.salesman,
      },
      summary: {
        totalOrdersCount: retailer.orders.length,
        totalInvoicedAmount:
          Math.round(
            retailer.orders
              .filter((o) => o.status !== 'REJECTED')
              .reduce((sum, o) => sum + o.finalAmount, 0) * 100
          ) / 100,
        paymentTerms: 'Weekly Settlement / Net 7 Days from Delivery',
        distributorUpiVpa: 'supplysetu.distributor@icici',
        distributorBankName: 'State Bank of India (Lordganj Branch, Jabalpur)',
        distributorAccountNo: '30492817492',
        distributorIfsc: 'SBIN0001242',
      },
      transactions,
    };
  }

  /**
   * Record a payment/settlement on the retailer's khata
   */
  static async recordPayment(
    retailerId: string,
    data: {
      amount: number;
      paymentMode?: string;
      referenceNo?: string;
      notes?: string;
    }
  ) {
    const { amount, paymentMode = 'UPI', referenceNo, notes } = data;
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
    if (!retailer) {
      throw new Error(`Retailer ${retailerId} not found`);
    }

    const updated = await prisma.retailer.update({
      where: { id: retailerId },
      data: {
        outstandingBalance: {
          decrement: amount,
        },
      },
    });

    const finalBalance = Math.max(0, updated.outstandingBalance);
    // Ensure balance doesn't go below 0
    if (updated.outstandingBalance < 0) {
      await prisma.retailer.update({
        where: { id: retailerId },
        data: { outstandingBalance: 0 },
      });
    }

    const receiptNo = referenceNo || `PAY-REC-${Date.now().toString().slice(-6)}`;
    recordedPaymentsStore.push({
      id: `txn-pay-${Date.now()}`,
      retailerId,
      amount,
      paymentMode,
      referenceNo: receiptNo,
      notes: notes || 'Instant UPI payment for Khata balance settlement',
      createdAt: new Date(),
    });

    return {
      success: true,
      receiptNumber: receiptNo,
      amountPaid: amount,
      paymentMode,
      previousBalance: retailer.outstandingBalance,
      newOutstandingBalance: finalBalance,
      availableCredit: Math.max(0, retailer.creditLimit - finalBalance),
      notes,
      recordedAt: new Date().toISOString(),
    };
  }
}
