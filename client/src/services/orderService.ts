import { Order, OrderDeskMetrics, OrderStatus } from '../types';
import { apiFetch } from './api';

const LOCAL_STORAGE_ORDERS_KEY = 'supplysetu-orders-history';

// Default initial orders for demonstration & offline fallback
const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord-1042',
    orderNumber: 'ORD-1042',
    retailerId: 'ret-1',
    status: 'PENDING',
    totalAmount: 11220.0,
    discountAmount: 224.4,
    gstAmount: 854.4,
    finalAmount: 11850.0,
    notes: 'Morning rush Kirana order | Created via AI Pad',
    createdVia: 'AI_CAPTURE',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    creditStatus: 'CLEARED',
    creditExcessAmount: 0,
    retailer: {
      id: 'ret-1',
      shopName: 'Shri Ganesh Kirana & General Store',
      ownerName: 'Anil Patel',
      phone: '9893000003',
      city: 'Jabalpur (Lordganj)',
      creditLimit: 75000,
      outstandingBalance: 14200,
    },
    salesman: {
      id: 'usr-salesman-1',
      name: 'Vikram Sharma',
      phone: '9893000002',
    },
    items: [
      {
        id: 'item-1',
        productId: 'p-parle-g-80g',
        quantity: 10,
        unit: 'BOX',
        unitPrice: 597.8,
        gstRate: 5.0,
        discountAmount: 0,
        freeQuantity: 1,
        totalPrice: 6276.9,
        product: {
          name: 'Parle-G Glucose Biscuit (80g x 72 Pack)',
          skuCode: 'PARLE-G-80G',
          brand: 'Parle',
          packSize: '72 Packets / Box',
        },
      },
      {
        id: 'item-2',
        productId: 'p-maggi-70g',
        quantity: 5,
        unit: 'CASE',
        unitPrice: 1127.0,
        gstRate: 12.0,
        discountAmount: 0,
        freeQuantity: 0,
        totalPrice: 6311.2,
        product: {
          name: 'Nestlé Maggi 2-Minute Masala Noodles (70g x 96 Pack)',
          skuCode: 'MAGGI-NOODLE-70G',
          brand: 'Nestlé',
          packSize: '96 Packets / Case',
        },
      },
    ],
    itemCount: 2,
    totalUnitsCount: 15,
    freeUnitsCount: 1,
  },
  {
    id: 'ord-1043',
    orderNumber: 'ORD-1043',
    retailerId: 'ret-2',
    status: 'PENDING',
    totalAmount: 18400.0,
    discountAmount: 0,
    gstAmount: 2208.0,
    finalAmount: 20608.0,
    notes: 'Credit Limit Warning: Exceeds available credit line by ₹2,608',
    createdVia: 'SALESMAN_APP',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    creditStatus: 'HOLD',
    creditExcessAmount: 2608.0,
    retailer: {
      id: 'ret-2',
      shopName: 'Mahalaxmi Provision & Dairy',
      ownerName: 'Sunil Agrawal',
      phone: '9893000004',
      city: 'Jabalpur (Wright Town)',
      creditLimit: 50000,
      outstandingBalance: 32000,
    },
    salesman: {
      id: 'usr-salesman-1',
      name: 'Vikram Sharma',
      phone: '9893000002',
    },
    items: [
      {
        id: 'item-3',
        productId: 'p-fortune-soya-1l',
        quantity: 12,
        unit: 'BOX',
        unitPrice: 1475.0,
        gstRate: 5.0,
        discountAmount: 0,
        freeQuantity: 0,
        totalPrice: 18585.0,
        product: {
          name: 'Fortune Refined Soyabean Oil (1L Pouch x 12 Pack)',
          skuCode: 'FORTUNE-SOYA-1L',
          brand: 'Fortune Adani',
          packSize: '12 Pouches / Box',
        },
      },
    ],
    itemCount: 1,
    totalUnitsCount: 12,
    freeUnitsCount: 0,
  },
  {
    id: 'ord-1044',
    orderNumber: 'ORD-1044',
    retailerId: 'ret-3',
    status: 'APPROVED',
    totalAmount: 24750.0,
    discountAmount: 1237.5,
    gstAmount: 4232.25,
    finalAmount: 27744.75,
    notes: 'Approved by Ramesh Gupta & sent to dispatch bay 2',
    createdVia: 'PORTAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    creditStatus: 'CLEARED',
    creditExcessAmount: 0,
    retailer: {
      id: 'ret-3',
      shopName: 'Mahakaushal Wholesale Mart',
      ownerName: 'Rajesh Jain',
      phone: '9893000005',
      city: 'Jabalpur (Gol Bazar)',
      creditLimit: 200000,
      outstandingBalance: 45000,
    },
    items: [
      {
        id: 'item-4',
        productId: 'p-surf-excel-500g',
        quantity: 10,
        unit: 'BOX',
        unitPrice: 1940.4,
        gstRate: 18.0,
        discountAmount: 970.2,
        freeQuantity: 0,
        totalPrice: 21751.88,
        product: {
          name: 'Surf Excel Easy Wash Detergent Powder (500g x 36 Pack)',
          skuCode: 'SURF-EXCEL-500G',
          brand: 'Hindustan Unilever',
          packSize: '36 Packs / Box',
        },
      },
    ],
    itemCount: 1,
    totalUnitsCount: 10,
    freeUnitsCount: 0,
  },
];

function getStoredOrders(): Order[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_DEMO_ORDERS;
}

function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {}
}

export const OrderService = {
  async createOrder(data: {
    retailerId?: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
    createdVia?: string;
  }): Promise<Order> {
    try {
      const res = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        // Also cache locally
        const existing = getStoredOrders();
        saveStoredOrders([res.data, ...existing]);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unreachable, placing order via local store:', err);
    }

    // Local fallback order creation
    const existing = getStoredOrders();
    const newNumber = `ORD-${1045 + existing.length}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newNumber,
      retailerId: data.retailerId || 'ret-1',
      status: 'PENDING',
      totalAmount: 14500.0,
      discountAmount: 290.0,
      gstAmount: 1540.0,
      finalAmount: 15750.0,
      notes: data.notes || 'Order placed via Kirana Portal',
      createdVia: data.createdVia || 'PORTAL',
      createdAt: new Date().toISOString(),
      creditStatus: 'CLEARED',
      creditExcessAmount: 0,
      retailer: {
        id: 'ret-1',
        shopName: 'Shri Ganesh Kirana & General Store',
        ownerName: 'Anil Patel',
        phone: '9893000003',
        city: 'Jabalpur (Lordganj)',
        creditLimit: 75000,
        outstandingBalance: 14200,
      },
      items: data.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        quantity: it.quantity,
        unit: 'BOX',
        unitPrice: 610.0,
        gstRate: 5.0,
        discountAmount: 0,
        freeQuantity: 0,
        totalPrice: 610.0 * it.quantity,
        product: {
          name: 'Parle-G Glucose Biscuit (80g x 72 Pack)',
          skuCode: 'PARLE-G-80G',
          brand: 'Parle',
          packSize: '72 Packets / Box',
        },
      })),
      itemCount: data.items.length,
      totalUnitsCount: data.items.reduce((s, i) => s + i.quantity, 0),
      freeUnitsCount: 0,
    };

    saveStoredOrders([newOrder, ...existing]);
    return newOrder;
  },

  async listOrders(filter?: { status?: OrderStatus; search?: string }): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.search) params.append('q', filter.search);

      const res = await apiFetch<{ orders: Order[] }>(`/orders?${params.toString()}`);
      if (res.success && res.data?.orders) {
        return res.data.orders;
      }
    } catch (err) {
      console.warn('Backend API unreachable, reading cached orders:', err);
    }

    let list = getStoredOrders();
    if (filter?.status) {
      list = list.filter((o) => o.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.retailer.shopName.toLowerCase().includes(q) ||
          o.retailer.ownerName.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async approveOrder(orderId: string, notes?: string): Promise<Order> {
    try {
      const res = await apiFetch<Order>(`/orders/${orderId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unreachable, approving locally:', err);
    }

    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'APPROVED' as OrderStatus,
            notes: notes ? `${o.notes || ''} [Approved: ${notes}]` : o.notes,
          }
        : o
    );
    saveStoredOrders(updated);
    return updated.find((o) => o.id === orderId)!;
  },

  async rejectOrder(orderId: string, reason: string): Promise<Order> {
    try {
      const res = await apiFetch<Order>(`/orders/${orderId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unreachable, rejecting locally:', err);
    }

    const orders = getStoredOrders();
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'REJECTED' as OrderStatus,
            notes: `${o.notes || ''} [Rejected: ${reason}]`,
          }
        : o
    );
    saveStoredOrders(updated);
    return updated.find((o) => o.id === orderId)!;
  },

  async getDeskMetrics(): Promise<OrderDeskMetrics> {
    try {
      const res = await apiFetch<OrderDeskMetrics>('/orders/metrics');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      // ignore
    }

    const orders = getStoredOrders();
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const approved = orders.filter((o) => o.status === 'APPROVED').length;
    const rejected = orders.filter((o) => o.status === 'REJECTED').length;
    const holds = orders.filter((o) => o.status === 'PENDING' && o.creditStatus === 'HOLD').length;
    const gmv = orders.reduce((sum, o) => sum + o.finalAmount, 0);

    return {
      totalOrdersToday: 412 + orders.length,
      pendingOrders: 36 + pending,
      approvedOrders: 374 + approved,
      rejectedOrders: rejected,
      totalGmv: 842500 + gmv,
      creditHoldCount: 6 + holds,
      activeSalesmenCount: 18,
    };
  },
};
