import { prisma } from '../../config';
import { OrderStatus } from '@prisma/client';

export interface BrandContribution {
  brand: string;
  revenue: number;
  ordersCount: number;
  percentage: number;
}

export interface CategoryContribution {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopRetailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  creditLimit: number;
  outstandingBalance: number;
}

export interface ChurnRetailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  daysDormant: number;
  lastOrderDate: string | null;
  lastOrderAmount: number | null;
  totalHistoricalOrders: number;
  riskLevel: 'HIGH' | 'MEDIUM';
  salesmanId: string | null;
  salesmanName: string | null;
  suggestedWhatsAppMessage: string;
  whatsAppUrl: string;
}

export interface HighRiskCreditRetailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  utilizationPct: number;
  status: 'EXCEEDED' | 'WARNING' | 'HEALTHY';
  whatsappReminderUrl: string;
}

export interface SalesmanPerformanceRecord {
  id: string;
  name: string;
  phone: string;
  assignedShopsCount: number;
  ordersTodayCount: number;
  gmvToday: number;
  dailyTargetGmv: number;
  targetAchievementPct: number;
  strikeRatePct: number;
  monthOrdersCount: number;
  monthGmv: number;
}

export class AnalyticsService {
  /**
   * 1. Executive Overview Analytics
   */
  static async getExecutiveOverview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrdersCount,
      allOrders,
      retailersCount,
      orderItemsWithProduct,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          finalAmount: true,
          totalAmount: true,
          createdAt: true,
          retailerId: true,
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
        },
      }),
      prisma.retailer.count({ where: { isActive: true } }),
      prisma.orderItem.findMany({
        select: {
          quantity: true,
          totalPrice: true,
          product: {
            select: {
              brand: true,
              category: true,
            },
          },
        },
      }),
    ]);

    // Financial Metrics
    const totalGmv = allOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);
    const todayGmv = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const aov = totalOrders > 0 ? Math.round((totalGmv / totalOrders) * 100) / 100 : 0;

    // Status breakdown
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      REJECTED: 0,
    };

    allOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const fulfilledCount =
      statusCounts.APPROVED + statusCounts.DISPATCHED + statusCounts.DELIVERED;
    const fulfillmentRate =
      totalOrders > 0 ? Math.round((fulfilledCount / totalOrders) * 1000) / 10 : 100;

    // Brand contribution
    const brandMap: Record<string, { revenue: number; count: number }> = {};
    const categoryMap: Record<string, number> = {};
    let itemRevenueTotal = 0;

    orderItemsWithProduct.forEach((item) => {
      itemRevenueTotal += item.totalPrice;
      const b = item.product.brand || 'Other FMCG';
      const c = item.product.category || 'General Kirana';

      if (!brandMap[b]) brandMap[b] = { revenue: 0, count: 0 };
      brandMap[b].revenue += item.totalPrice;
      brandMap[b].count += item.quantity;

      categoryMap[c] = (categoryMap[c] || 0) + item.totalPrice;
    });

    const brandBreakdown: BrandContribution[] = Object.entries(brandMap)
      .map(([brand, data]) => ({
        brand,
        revenue: Math.round(data.revenue),
        ordersCount: data.count,
        percentage:
          itemRevenueTotal > 0
            ? Math.round((data.revenue / itemRevenueTotal) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const categoryBreakdown: CategoryContribution[] = Object.entries(categoryMap)
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue),
        percentage:
          itemRevenueTotal > 0
            ? Math.round((revenue / itemRevenueTotal) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top Kiranas by spend
    const retailerSpendMap: Record<string, { retailer: any; totalOrders: number; totalSpent: number }> = {};
    allOrders.forEach((o) => {
      const rId = o.retailerId;
      if (!retailerSpendMap[rId]) {
        retailerSpendMap[rId] = {
          retailer: o.retailer,
          totalOrders: 0,
          totalSpent: 0,
        };
      }
      retailerSpendMap[rId].totalOrders += 1;
      retailerSpendMap[rId].totalSpent += o.finalAmount;
    });

    const topRetailers: TopRetailer[] = Object.values(retailerSpendMap)
      .map(({ retailer, totalOrders, totalSpent }) => ({
        id: retailer.id,
        shopName: retailer.shopName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        city: retailer.city,
        totalOrders,
        totalSpent: Math.round(totalSpent),
        creditLimit: retailer.creditLimit,
        outstandingBalance: retailer.outstandingBalance,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      kpi: {
        totalOrders,
        totalGmv: Math.round(totalGmv),
        todayOrdersCount,
        todayGmv: Math.round(todayGmv),
        aov,
        fulfillmentRate,
        activeRetailersCount: retailersCount,
      },
      statusDistribution: statusCounts,
      brandBreakdown,
      categoryBreakdown,
      topRetailers,
    };
  }

  /**
   * 2. 14-Day Inactive Kirana Churn Radar
   */
  static async getChurnRadar(daysThreshold: number = 14): Promise<ChurnRetailer[]> {
    const now = new Date();
    const retailers = await prisma.retailer.findMany({
      where: { isActive: true },
      include: {
        salesman: {
          select: { id: true, name: true, phone: true },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            finalAmount: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    const inactiveList: ChurnRetailer[] = [];

    for (const r of retailers) {
      const lastOrder = r.orders[0];
      let daysDormant = 0;
      let lastOrderDate: string | null = null;
      let lastOrderAmount: number | null = null;

      if (lastOrder) {
        lastOrderDate = lastOrder.createdAt.toISOString();
        lastOrderAmount = lastOrder.finalAmount;
        const diffMs = now.getTime() - new Date(lastOrder.createdAt).getTime();
        daysDormant = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      } else {
        // No orders placed since creation
        const diffMs = now.getTime() - new Date(r.createdAt).getTime();
        daysDormant = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      if (daysDormant >= daysThreshold) {
        const riskLevel: 'HIGH' | 'MEDIUM' = daysDormant >= 21 ? 'HIGH' : 'MEDIUM';

        // Pre-composed personalized FMCG re-engagement WhatsApp copy
        const cleanPhone = r.phone.replace(/[^0-9]/g, '');
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const message = `Namaste ${r.ownerName} Ji! SupplySetu Distributors Jabalpur misses ${r.shopName}. We noticed you haven't placed an order in ${daysDormant} days. We have special trade schemes live on Parle-G (10+1 free) and Surf Excel today. Order directly on your portal or reply here to book your stock!`;
        const whatsAppUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;

        inactiveList.push({
          id: r.id,
          shopName: r.shopName,
          ownerName: r.ownerName,
          phone: r.phone,
          city: r.city,
          daysDormant,
          lastOrderDate,
          lastOrderAmount,
          totalHistoricalOrders: r._count.orders,
          riskLevel,
          salesmanId: r.salesman?.id || null,
          salesmanName: r.salesman?.name || null,
          suggestedWhatsAppMessage: message,
          whatsAppUrl,
        });
      }
    }

    // Sort by most dormant first
    return inactiveList.sort((a, b) => b.daysDormant - a.daysDormant);
  }

  /**
   * 3. Distributor Financials & Credit Risk Monitor
   */
  static async getFinancialRisk() {
    const retailers = await prisma.retailer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        phone: true,
        creditLimit: true,
        outstandingBalance: true,
        orders: {
          where: { status: { in: [OrderStatus.APPROVED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { createdAt: true, finalAmount: true },
        },
      },
    });

    const totalCreditExtended = retailers.reduce((sum, r) => sum + r.creditLimit, 0);
    const totalOutstanding = retailers.reduce((sum, r) => sum + r.outstandingBalance, 0);
    const overallUtilization =
      totalCreditExtended > 0
        ? Math.round((totalOutstanding / totalCreditExtended) * 1000) / 10
        : 0;

    // High risk retailers (utilization >= 80% or exceeded)
    const highRiskRetailers: HighRiskCreditRetailer[] = [];

    // Aging buckets estimation
    let aging0to15 = 0;
    let aging16to30 = 0;
    let aging30plus = 0;

    const now = new Date();

    retailers.forEach((r) => {
      const utilPct =
        r.creditLimit > 0
          ? Math.round((r.outstandingBalance / r.creditLimit) * 1000) / 10
          : 0;

      let status: 'EXCEEDED' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (r.outstandingBalance > r.creditLimit) {
        status = 'EXCEEDED';
      } else if (utilPct >= 80) {
        status = 'WARNING';
      }

      const cleanPhone = r.phone.replace(/[^0-9]/g, '');
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const reminderMsg = `Namaste ${r.ownerName} Ji, friendly reminder from SupplySetu Distributors: your current outstanding balance is Rs. ${r.outstandingBalance.toLocaleString('en-IN')}. Please settle via UPI or cheque to maintain your credit limit of Rs. ${r.creditLimit.toLocaleString('en-IN')}. Thank you!`;
      const whatsappReminderUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(reminderMsg)}`;

      if (status !== 'HEALTHY' || r.outstandingBalance > 20000) {
        highRiskRetailers.push({
          id: r.id,
          shopName: r.shopName,
          ownerName: r.ownerName,
          phone: r.phone,
          creditLimit: r.creditLimit,
          outstandingBalance: r.outstandingBalance,
          utilizationPct: utilPct,
          status,
          whatsappReminderUrl,
        });
      }

      // Receivables Aging distribution based on recent invoice dates
      if (r.outstandingBalance > 0) {
        const lastOrder = r.orders[0];
        if (lastOrder) {
          const daysOld = Math.floor(
            (now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysOld <= 15) {
            aging0to15 += r.outstandingBalance;
          } else if (daysOld <= 30) {
            aging16to30 += r.outstandingBalance;
          } else {
            aging30plus += r.outstandingBalance;
          }
        } else {
          aging0to15 += r.outstandingBalance;
        }
      }
    });

    return {
      summary: {
        totalCreditExtended: Math.round(totalCreditExtended),
        totalOutstanding: Math.round(totalOutstanding),
        availableCreditNetwork: Math.round(Math.max(0, totalCreditExtended - totalOutstanding)),
        overallUtilizationPct: overallUtilization,
        overLimitRetailersCount: highRiskRetailers.filter((r) => r.status === 'EXCEEDED').length,
        warningRetailersCount: highRiskRetailers.filter((r) => r.status === 'WARNING').length,
      },
      aging: {
        current0to15Days: Math.round(aging0to15),
        overdue16to30Days: Math.round(aging16to30),
        critical30PlusDays: Math.round(aging30plus),
      },
      highRiskRetailers: highRiskRetailers.sort((a, b) => b.utilizationPct - a.utilizationPct),
    };
  }

  /**
   * 4. Salesman Beat Targets & Field Performance
   */
  static async getSalesmanPerformance(targetSalesmanId?: string): Promise<SalesmanPerformanceRecord[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const whereSalesman: any = { role: 'SALESMAN', isActive: true };
    if (targetSalesmanId) {
      whereSalesman.id = targetSalesmanId;
    }

    const salesmen = await prisma.user.findMany({
      where: whereSalesman,
      select: {
        id: true,
        name: true,
        phone: true,
        assignedRetailers: {
          where: { isActive: true },
          select: { id: true },
        },
        ordersPlaced: {
          select: {
            id: true,
            finalAmount: true,
            createdAt: true,
            retailerId: true,
          },
        },
      },
    });

    const DAILY_TARGET_GMV = 45000; // Standard FMCG distributor daily beat quota in Jabalpur

    return salesmen.map((sm) => {
      const todayOrders = sm.ordersPlaced.filter((o) => new Date(o.createdAt) >= todayStart);
      const monthOrders = sm.ordersPlaced.filter((o) => new Date(o.createdAt) >= monthStart);

      const gmvToday = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);
      const monthGmv = monthOrders.reduce((sum, o) => sum + o.finalAmount, 0);

      const assignedShopsCount = sm.assignedRetailers.length;
      const uniqueShopsVisitedToday = new Set(todayOrders.map((o) => o.retailerId)).size;

      const strikeRatePct =
        assignedShopsCount > 0
          ? Math.round((uniqueShopsVisitedToday / assignedShopsCount) * 1000) / 10
          : 0;

      const targetAchievementPct =
        Math.round((gmvToday / DAILY_TARGET_GMV) * 1000) / 10;

      return {
        id: sm.id,
        name: sm.name,
        phone: sm.phone,
        assignedShopsCount,
        ordersTodayCount: todayOrders.length,
        gmvToday: Math.round(gmvToday),
        dailyTargetGmv: DAILY_TARGET_GMV,
        targetAchievementPct,
        strikeRatePct,
        monthOrdersCount: monthOrders.length,
        monthGmv: Math.round(monthGmv),
      };
    });
  }
}
