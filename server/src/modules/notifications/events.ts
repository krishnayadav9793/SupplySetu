import { EventEmitter } from 'events';

export interface LiveOrderEventPayload {
  id: string;
  orderNumber: string;
  retailerId: string;
  shopName: string;
  ownerName: string;
  city: string;
  salesmanId?: string | null;
  salesmanName?: string | null;
  totalAmount: number;
  finalAmount: number;
  itemsCount: number;
  creditStatus: 'APPROVED' | 'HOLD';
  createdVia: string;
  createdAt: string;
}

export interface OrderStatusEventPayload {
  id: string;
  orderNumber: string;
  status: 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
  shopName: string;
  finalAmount: number;
  reason?: string;
  updatedAt: string;
}

export interface StockUpdatedEventPayload {
  productId: string;
  skuCode?: string;
  name?: string;
  stockQuantity: number;
  minOrderQty?: number;
  updatedAt: string;
}

export type LiveNotificationEvent =
  | { type: 'ORDER_CREATED'; data: LiveOrderEventPayload }
  | { type: 'ORDER_STATUS_CHANGED'; data: OrderStatusEventPayload }
  | { type: 'STOCK_UPDATED'; data: StockUpdatedEventPayload };

class NotificationEventBus extends EventEmitter {
  private recentNotifications: LiveNotificationEvent[] = [];
  private readonly MAX_HISTORY = 30;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  public broadcast(event: LiveNotificationEvent) {
    this.recentNotifications.unshift(event);
    if (this.recentNotifications.length > this.MAX_HISTORY) {
      this.recentNotifications.pop();
    }
    this.emit('notification', event);
  }

  public getRecent(): LiveNotificationEvent[] {
    return [...this.recentNotifications];
  }
}

export const eventBus = new NotificationEventBus();
