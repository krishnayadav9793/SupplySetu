export interface LiveOrderCreatedData {
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

export interface LiveOrderStatusData {
  id: string;
  orderNumber: string;
  status: 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
  shopName: string;
  finalAmount: number;
  reason?: string;
  updatedAt: string;
}

export interface LiveStockUpdatedData {
  productId: string;
  skuCode?: string;
  name?: string;
  stockQuantity: number;
  minOrderQty?: number;
  updatedAt: string;
}

export type LiveNotificationEvent =
  | { type: 'ORDER_CREATED'; data: LiveOrderCreatedData }
  | { type: 'ORDER_STATUS_CHANGED'; data: LiveOrderStatusData }
  | { type: 'STOCK_UPDATED'; data: LiveStockUpdatedData };

export interface ActiveUserContext {
  id: string;
  role: 'ADMIN' | 'SALESMAN' | 'RETAILER';
  name?: string;
  retailerId?: string;
  salesmanId?: string;
}

export interface StoredNotification {
  id: string;
  type: LiveNotificationEvent['type'];
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: string;
  targetOrderId?: string;
  roleRelevance: 'ADMIN' | 'SALESMAN' | 'RETAILER' | 'ALL';
  rawEvent: LiveNotificationEvent;
}

type NotificationListener = (event: LiveNotificationEvent) => void;
type StatusListener = (connected: boolean) => void;

class NotificationServiceManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<NotificationListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private notifications: StoredNotification[] = [];
  private isConnected = false;
  private reconnectTimeout: any = null;
  private isMuted = false;
  private currentUser: ActiveUserContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public setCurrentUser(user: ActiveUserContext | null) {
    this.currentUser = user;
    // Broadcast status sync to trigger UI update
    this.broadcastToListeners({
      type: 'STOCK_UPDATED',
      data: {
        productId: 'sync',
        stockQuantity: 0,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  public getCurrentUser(): ActiveUserContext | null {
    return this.currentUser;
  }

  public connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const streamUrl = `${apiBase}/notifications/stream`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'CONNECTED') return;

          const notifEvent = payload as LiveNotificationEvent;
          this.handleIncomingEvent(notifEvent);
        } catch (e) {
          // heartbeat or unparseable event
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Retry connection after 5 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 5000);
        }
      };
    } catch (err) {
      this.isConnected = false;
      this.notifyStatus(false);
    }
  }

  private handleIncomingEvent(event: LiveNotificationEvent) {
    const role = this.currentUser?.role || 'ADMIN';
    let title = '';
    let message = '';
    let targetTab: string | undefined = undefined;
    let targetOrderId: string | undefined = undefined;
    let roleRelevance: 'ADMIN' | 'SALESMAN' | 'RETAILER' | 'ALL' = 'ALL';

    if (event.type === 'ORDER_CREATED') {
      const o = event.data;
      targetOrderId = o.id || o.orderNumber;
      const via =
        o.createdVia === 'SALESMAN_APP'
          ? `Beat Salesman ${o.salesmanName || 'Field Agent'}`
          : o.createdVia === 'AI_CAPTURE'
          ? 'AI WhatsApp Pad'
          : 'Retailer Portal';

      if (role === 'RETAILER') {
        const isMyOrder = !this.currentUser?.retailerId || o.retailerId === this.currentUser.retailerId;
        title = isMyOrder ? `Order Placed: #${o.orderNumber}` : `Hub Order: #${o.orderNumber}`;
        message = isMyOrder
          ? `Your order of ₹${o.finalAmount.toFixed(0)} (${o.itemsCount} items) has been received by Jabalpur Hub.`
          : `${o.shopName} placed ₹${o.finalAmount.toFixed(0)} via ${via}`;
        targetTab = 'my-orders';
        roleRelevance = 'RETAILER';
      } else if (role === 'SALESMAN') {
        title = `Beat Order Punched: #${o.orderNumber}`;
        message = `${o.shopName} placed ₹${o.finalAmount.toFixed(0)} (${o.itemsCount} SKUs). Daily beat target updated!`;
        targetTab = 'beat';
        roleRelevance = 'SALESMAN';
      } else {
        // ADMIN
        const isHold = o.creditStatus === 'HOLD';
        title = isHold ? `⚠️ Credit Hold: #${o.orderNumber}` : `New Order: #${o.orderNumber}`;
        message = `${o.shopName} placed ₹${o.finalAmount.toFixed(0)} (${o.itemsCount} items) via ${via}. Status: ${o.creditStatus}`;
        targetTab = 'orders';
        roleRelevance = 'ADMIN';
      }

      this.playOrderChime();
    } else if (event.type === 'ORDER_STATUS_CHANGED') {
      const o = event.data;
      targetOrderId = o.id || o.orderNumber;
      const statusIcons: Record<string, string> = {
        APPROVED: '✅ Approved',
        DISPATCHED: '🚚 Dispatched',
        DELIVERED: '📦 Delivered',
        REJECTED: '❌ Rejected',
      };
      const statusLabel = statusIcons[o.status] || o.status;

      if (role === 'RETAILER') {
        title = `Order Status: ${statusLabel}`;
        message = `Your order #${o.orderNumber} (₹${o.finalAmount.toFixed(0)}) is now marked as ${o.status}.`;
        targetTab = 'my-orders';
        roleRelevance = 'RETAILER';
      } else if (role === 'SALESMAN') {
        title = `Beat Update: #${o.orderNumber} ${statusLabel}`;
        message = `${o.shopName} order of ₹${o.finalAmount.toFixed(0)} is now ${o.status}.`;
        targetTab = 'beat';
        roleRelevance = 'SALESMAN';
      } else {
        title = `Order ${statusLabel}: #${o.orderNumber}`;
        message = `${o.shopName} - ₹${o.finalAmount.toFixed(0)} is now ${o.status}`;
        targetTab = 'orders';
        roleRelevance = 'ADMIN';
      }
    } else if (event.type === 'STOCK_UPDATED') {
      const s = event.data;
      if (role === 'RETAILER') {
        title = `Restock Alert: ${s.skuCode || 'Product'}`;
        message = `Fresh inventory arrived at Jabalpur Hub (${s.stockQuantity} boxes available). Tap to order!`;
        targetTab = 'shop';
        roleRelevance = 'RETAILER';
      } else if (role === 'SALESMAN') {
        title = `Warehouse Stock: ${s.skuCode || 'Product'}`;
        message = `Available inventory for your beat: ${s.stockQuantity} boxes`;
        targetTab = 'catalogue';
        roleRelevance = 'SALESMAN';
      } else {
        title = `Stock Adjusted: ${s.skuCode || 'Product'}`;
        message = `Warehouse inventory adjusted to ${s.stockQuantity} boxes`;
        targetTab = 'catalogue';
        roleRelevance = 'ADMIN';
      }
    }

    const stored: StoredNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: event.type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      targetTab,
      targetOrderId,
      roleRelevance,
      rawEvent: event,
    };

    this.notifications.unshift(stored);
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }

    this.broadcastToListeners(event);
  }

  private broadcastToListeners(event: LiveNotificationEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in notification listener:', err);
      }
    });
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((l) => l(connected));
  }

  public getNotifications(forRole?: 'ADMIN' | 'SALESMAN' | 'RETAILER'): StoredNotification[] {
    const role = forRole || this.currentUser?.role;
    if (!role) return [...this.notifications];
    return this.notifications.filter(
      (n) => !n.roleRelevance || n.roleRelevance === 'ALL' || n.roleRelevance === role
    );
  }

  public getUnreadCount(forRole?: 'ADMIN' | 'SALESMAN' | 'RETAILER'): number {
    return this.getNotifications(forRole).filter((n) => !n.read).length;
  }

  public markAllAsRead(forRole?: 'ADMIN' | 'SALESMAN' | 'RETAILER') {
    const role = forRole || this.currentUser?.role;
    this.notifications.forEach((n) => {
      if (!role || !n.roleRelevance || n.roleRelevance === 'ALL' || n.roleRelevance === role) {
        n.read = true;
      }
    });
  }

  public markAsRead(id: string) {
    const n = this.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Generates a clean, subtle audio chime using browser Web Audio API
   */
  public playOrderChime() {
    if (this.isMuted || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Dual tone D5 -> A5 ascending chord
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // AudioContext might require user gesture, safe to ignore
    }
  }
}

export const NotificationService = new NotificationServiceManager();
