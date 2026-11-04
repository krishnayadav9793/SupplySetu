import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config';

export interface ExportHistoryRecord {
  id: string;
  batchNumber: string;
  orderCount: number;
  totalGmv: number;
  exportedAt: string;
  exportedBy: string;
  downloadUrl: string;
}

export class ExportsService {
  /**
   * Generates standard Tally ERP-compatible CSV string from approved orders
   */
  static async generateTallyCsv(): Promise<{
    csvContent: string;
    filename: string;
    orderCount: number;
    totalAmount: number;
  }> {
    // 1. Fetch approved orders that are eligible for Tally accounting
    const approvedOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.APPROVED,
      },
      include: {
        retailer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Order ID',
      'Order Date',
      'Retailer Code',
      'Retailer Name',
      'GSTIN',
      'City',
      'SKU Code',
      'Product Name',
      'Brand',
      'Pack Size',
      'Quantity',
      'Unit',
      'Free Quantity',
      'Dealer Rate (INR)',
      'Trade Discount (INR)',
      'Taxable Subtotal (INR)',
      'GST Rate (%)',
      'Item GST (INR)',
      'Total Item Amount (INR)',
      'Created Channel',
    ];

    const rows: string[][] = [];
    let totalExportAmount = 0;

    for (const order of approvedOrders) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];

      for (const item of order.items) {
        const taxable = Math.max(0, item.unitPrice * item.quantity - item.discountAmount);
        const itemGst = (taxable * item.gstRate) / 100;
        totalExportAmount += item.totalPrice;

        rows.push([
          order.orderNumber,
          orderDate,
          order.retailerId.substring(0, 8).toUpperCase(),
          `"${order.retailer.shopName.replace(/"/g, '""')}"`,
          order.retailer.gstNumber || 'UNREGISTERED',
          `"${order.retailer.city}"`,
          item.product.skuCode,
          `"${item.product.name.replace(/"/g, '""')}"`,
          item.product.brand,
          `"${item.product.packSize}"`,
          item.quantity.toString(),
          item.unit,
          (item.freeQuantity || 0).toString(),
          item.unitPrice.toFixed(2),
          item.discountAmount.toFixed(2),
          taxable.toFixed(2),
          item.gstRate.toString(),
          itemGst.toFixed(2),
          item.totalPrice.toFixed(2),
          order.createdVia,
        ]);
      }
    }

    // Build CSV
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `TALLY_ORDERS_${dateStr}_BATCH.csv`;

    return {
      csvContent,
      filename,
      orderCount: approvedOrders.length,
      totalAmount: Math.round(totalExportAmount * 100) / 100,
    };
  }

  /**
   * Mock or database export history list
   */
  static async getExportHistory(): Promise<ExportHistoryRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'exp-1',
        batchNumber: `TALLY-BATCH-${today}-01`,
        orderCount: 142,
        totalGmv: 312450.0,
        exportedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        exportedBy: 'Ramesh Gupta (Admin)',
        downloadUrl: '/api/exports/tally.csv',
      },
      {
        id: 'exp-2',
        batchNumber: `TALLY-BATCH-20261103-02`,
        orderCount: 189,
        totalGmv: 421800.0,
        exportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        exportedBy: 'Ramesh Gupta (Admin)',
        downloadUrl: '/api/exports/tally.csv',
      },
    ];
  }
}
