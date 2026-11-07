import { OrderStatus, Role } from '@prisma/client';
import { prisma } from '../../config';
import { PricingService } from '../pricing/pricing.service';
import { eventBus } from '../notifications/events';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  retailerId: string;
  salesmanId?: string;
  items: CreateOrderItemInput[];
  notes?: string;
  createdVia?: string; // 'PORTAL', 'AI_CAPTURE', 'SALESMAN_APP'
}

export interface OrderFilterParams {
  status?: OrderStatus;
  search?: string;
  retailerId?: string;
  salesmanId?: string;
  page?: number;
  limit?: number;
}

export class OrdersService {
  /**
   * Create an order with deterministic pricing, scheme benefits, and credit check
   */
  static async createOrder(input: CreateOrderInput) {
    const { retailerId, salesmanId, items, notes, createdVia = 'PORTAL' } = input;

    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one product item');
    }

    // 1. Fetch retailer profile
    const retailer = await prisma.retailer.findUnique({
      where: { id: retailerId },
    });

    if (!retailer) {
      throw new Error(`Retailer with ID ${retailerId} not found`);
    }

    // 2. Fetch all products and active schemes
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        inventory: true,
        schemes: { where: { isActive: true }, take: 1 },
      },
    });

    if (products.length !== items.length) {
      throw new Error('One or more products in the order could not be found');
    }

    let subtotalAmount = 0;
    let totalDiscountAmount = 0;
    let totalGstAmount = 0;
    let grandFinalAmount = 0;

    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      gstRate: number;
      discountAmount: number;
      freeQuantity: number;
      totalPrice: number;
    }> = [];

    for (const itemInput of items) {
      const product = products.find((p) => p.id === itemInput.productId);
      if (!product) continue;

      const qty = Math.max(1, itemInput.quantity);
      const pricing = PricingService.calculatePrice(
        product.basePrice,
        product.mrp,
        product.gstRate,
        retailer.priceTier
      );

      let discountAmount = 0;
      let freeQuantity = 0;

      const activeScheme = product.schemes[0];
      if (activeScheme && qty >= activeScheme.minQuantity) {
        if (activeScheme.schemeType === 'BUY_X_GET_Y_FREE') {
          const sets = Math.floor(qty / activeScheme.minQuantity);
          freeQuantity = sets * activeScheme.freeQuantity;
        } else if (activeScheme.schemeType === 'PERCENTAGE_DISCOUNT') {
          discountAmount = Math.round(((pricing.dealerPrice * qty * activeScheme.discountPercent) / 100) * 100) / 100;
        } else if (activeScheme.schemeType === 'FLAT_DISCOUNT') {
          discountAmount = Math.round((activeScheme.discountPercent * qty) * 100) / 100;
        }
      }

      const taxableSubtotal = Math.max(0, pricing.dealerPrice * qty - discountAmount);
      const itemGst = Math.round(((taxableSubtotal * product.gstRate) / 100) * 100) / 100;
      const itemFinalTotal = Math.round((taxableSubtotal + itemGst) * 100) / 100;

      subtotalAmount += pricing.dealerPrice * qty;
      totalDiscountAmount += discountAmount;
      totalGstAmount += itemGst;
      grandFinalAmount += itemFinalTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: qty,
        unit: product.unit,
        unitPrice: pricing.dealerPrice,
        gstRate: product.gstRate,
        discountAmount,
        freeQuantity,
        totalPrice: itemFinalTotal,
      });
    }

    // Generate unique sequential order number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${(1000 + count + 1).toString()}`;

    // Available credit calculation
    const availableCredit = Math.max(0, retailer.creditLimit - retailer.outstandingBalance);
    const exceedsCredit = grandFinalAmount > availableCredit;
    const creditNote = exceedsCredit
      ? `Credit Limit Warning: Exceeds available line by ₹${(grandFinalAmount - availableCredit).toFixed(0)}`
      : null;

    const fullNotes = [notes, creditNote].filter(Boolean).join(' | ');

    // 3. Persist Order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        retailerId,
        salesmanId: salesmanId || retailer.salesmanId,
        status: OrderStatus.PENDING,
        totalAmount: Math.round(subtotalAmount * 100) / 100,
        discountAmount: Math.round(totalDiscountAmount * 100) / 100,
        gstAmount: Math.round(totalGstAmount * 100) / 100,
        finalAmount: Math.round(grandFinalAmount * 100) / 100,
        notes: fullNotes,
        createdVia,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        retailer: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            phone: true,
            city: true,
            creditLimit: true,
            outstandingBalance: true,
          },
        },
        salesman: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                skuCode: true,
                brand: true,
                packSize: true,
              },
            },
          },
        },
      },
    });

    // Broadcast real-time live notification
    eventBus.broadcast({
      type: 'ORDER_CREATED',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        retailerId: order.retailerId,
        shopName: order.retailer.shopName,
        ownerName: order.retailer.ownerName,
        city: order.retailer.city,
        salesmanId: order.salesmanId,
        salesmanName: order.salesman ? order.salesman.name : null,
        totalAmount: order.totalAmount,
        finalAmount: order.finalAmount,
        itemsCount: order.items.length,
        creditStatus: exceedsCredit ? 'HOLD' : 'APPROVED',
        createdVia: order.createdVia,
        createdAt: order.createdAt.toISOString(),
      },
    });

    return order;
  }

  /**
   * List orders with filtering & search
   */
  static async listOrders(params: OrderFilterParams) {
    const { status, search, retailerId, salesmanId, page = 1, limit = 50 } = params;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (retailerId) {
      where.retailerId = retailerId;
    }

    if (salesmanId) {
      where.salesmanId = salesmanId;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { retailer: { shopName: { contains: term, mode: 'insensitive' } } },
        { retailer: { ownerName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          retailer: {
            select: {
              id: true,
              shopName: true,
              ownerName: true,
              phone: true,
              city: true,
              creditLimit: true,
              outstandingBalance: true,
            },
          },
          salesman: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  skuCode: true,
                  brand: true,
                  packSize: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Enhance with credit status flag
    const formatted = orders.map((o) => {
      const available = Math.max(0, o.retailer.creditLimit - o.retailer.outstandingBalance);
      const isCreditExceeded = o.finalAmount > available;
      return {
        ...o,
        creditStatus: isCreditExceeded ? 'HOLD' : 'CLEARED',
        creditExcessAmount: isCreditExceeded ? o.finalAmount - available : 0,
        itemCount: o.items.length,
        totalUnitsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        freeUnitsCount: o.items.reduce((sum, item) => sum + item.freeQuantity, 0),
      };
    });

    return {
      orders: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        retailer: true,
        salesman: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }

    const available = Math.max(0, order.retailer.creditLimit - order.retailer.outstandingBalance);
    return {
      ...order,
      creditStatus: order.finalAmount > available ? 'HOLD' : 'CLEARED',
      creditExcessAmount: order.finalAmount > available ? order.finalAmount - available : 0,
    };
  }

  /**
   * Approve order: Updates status, reserves inventory, adds to retailer balance
   */
  static async approveOrder(id: string, notes?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, retailer: true },
    });

    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error(`Order is currently ${order.status} and cannot be approved`);
    }

    // Execute in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Decrement inventory for each item
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity + (item.freeQuantity || 0),
            },
          },
        });
      }

      // 2. Increase retailer outstanding balance
      await tx.retailer.update({
        where: { id: order.retailerId },
        data: {
          outstandingBalance: {
            increment: order.finalAmount,
          },
        },
      });

      // 3. Update order status to APPROVED
      const approved = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.APPROVED,
          notes: notes ? `${order.notes || ''} [Approved: ${notes}]` : order.notes,
        },
        include: {
          retailer: true,
          items: {
            include: { product: true },
          },
        },
      });

      return approved;
    });

    // Broadcast live event
    eventBus.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: 'APPROVED',
        shopName: updatedOrder.retailer.shopName,
        finalAmount: updatedOrder.finalAmount,
        reason: notes,
        updatedAt: updatedOrder.updatedAt.toISOString(),
      },
    });

    return updatedOrder;
  }

  /**
   * Reject order with reason note
   */
  static async rejectOrder(id: string, reason: string) {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error(`Order is currently ${order.status} and cannot be rejected`);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REJECTED,
        notes: `${order.notes || ''} [Rejected: ${reason}]`,
      },
      include: {
        retailer: true,
      },
    });

    // Broadcast live event
    eventBus.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      data: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: 'REJECTED',
        shopName: updated.retailer.shopName,
        finalAmount: updated.finalAmount,
        reason,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });

    return updated;
  }

  /**
   * Update order status to DISPATCHED
   */
  static async dispatchOrder(id: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error(`Order ${id} not found`);

    if (order.status !== OrderStatus.APPROVED) {
      throw new Error('Only approved orders can be dispatched');
    }

    return prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DISPATCHED },
    });
  }

  /**
   * Get Order Desk live summary statistics
   */
  static async getOrderDeskMetrics() {
    const [totalOrdersToday, pendingOrders, approvedOrders, rejectedOrders, allOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        prisma.order.count({ where: { status: OrderStatus.APPROVED } }),
        prisma.order.count({ where: { status: OrderStatus.REJECTED } }),
        prisma.order.findMany({
          select: {
            finalAmount: true,
            status: true,
            retailer: {
              select: { creditLimit: true, outstandingBalance: true },
            },
          },
        }),
      ]);

    const totalGmv = allOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const creditHoldCount = allOrders.filter((o) => {
      if (o.status !== OrderStatus.PENDING) return false;
      const avail = Math.max(0, o.retailer.creditLimit - o.retailer.outstandingBalance);
      return o.finalAmount > avail;
    }).length;

    return {
      totalOrdersToday,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalGmv: Math.round(totalGmv * 100) / 100,
      creditHoldCount,
      activeSalesmenCount: 18,
    };
  }
}
