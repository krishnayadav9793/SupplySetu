import { db, OfflineOrderRecord } from './db';
import { Product, RetailerProfile } from '../types';
import { OrderService } from '../services/orderService';

type SyncListener = (pendingCount: number, isOnline: boolean) => void;

class SyncServiceManager {
  private isSimulatedOffline = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notify();
        this.syncPendingOrders();
      });
      window.addEventListener('offline', () => {
        this.notify();
      });
    }
  }

  public isOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.notify();
    if (!offline) {
      this.syncPendingOrders();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getPendingCount().then((count) => listener(count, this.isOnline()));
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const count = await this.getPendingCount();
    const online = this.isOnline();
    this.listeners.forEach((l) => l(count, online));
  }

  /**
   * Cache products & retailers into Dexie IndexedDB
   */
  public async cacheCatalogueData(products: Product[], retailers: RetailerProfile[]) {
    try {
      await db.cachedProducts.bulkPut(products);
      await db.cachedRetailers.bulkPut(retailers);
    } catch (err) {
      console.warn('Could not cache catalogue in IndexedDB:', err);
    }
  }

  /**
   * Retrieve cached products from Dexie IndexedDB
   */
  public async getCachedProducts(): Promise<Product[]> {
    try {
      const items = await db.cachedProducts.toArray();
      if (items.length > 0) return items;
    } catch (err) {
      console.warn('Error reading cached products:', err);
    }
    return [];
  }

  /**
   * Retrieve cached retailers from Dexie IndexedDB
   */
  public async getCachedRetailers(): Promise<RetailerProfile[]> {
    try {
      const items = await db.cachedRetailers.toArray();
      if (items.length > 0) return items;
    } catch (err) {
      console.warn('Error reading cached retailers:', err);
    }
    return [];
  }

  /**
   * Queue an order into IndexedDB when offline
   */
  public async queueOfflineOrder(data: {
    retailerId: string;
    retailerName: string;
    salesmanId?: string;
    items: Array<{
      productId: string;
      productName: string;
      skuCode: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      gstRate: number;
      totalPrice: number;
    }>;
    notes?: string;
  }): Promise<OfflineOrderRecord> {
    const clientOrderId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const finalAmount = data.items.reduce((s, i) => s + i.totalPrice, 0);

    const record: OfflineOrderRecord = {
      clientOrderId,
      retailerId: data.retailerId,
      retailerName: data.retailerName,
      salesmanId: data.salesmanId,
      items: data.items,
      finalAmount,
      status: 'PENDING_SYNC',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    const id = await db.offlineOrders.add(record);
    record.id = id;

    this.notify();

    // If actually online, attempt immediate sync in background
    if (this.isOnline()) {
      this.syncPendingOrders();
    }

    return record;
  }

  /**
   * Get all orders waiting to be synced
   */
  public async getPendingOrders(): Promise<OfflineOrderRecord[]> {
    try {
      return await db.offlineOrders.where('status').equals('PENDING_SYNC').toArray();
    } catch (e) {
      return [];
    }
  }

  /**
   * Count of unsynced offline orders
   */
  public async getPendingCount(): Promise<number> {
    try {
      return await db.offlineOrders.where('status').equals('PENDING_SYNC').count();
    } catch (e) {
      return 0;
    }
  }

  /**
   * Synchronize all pending offline orders to backend
   */
  public async syncPendingOrders(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    const pending = await this.getPendingOrders();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const order of pending) {
      try {
        await OrderService.createOrder({
          retailerId: order.retailerId,
          items: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          notes: `Offline Sync: ${order.clientOrderId} | Created at: ${new Date(order.createdAt).toLocaleTimeString()}`,
          createdVia: 'SALESMAN_APP',
        });

        if (order.id) {
          await db.offlineOrders.update(order.id, {
            status: 'SYNCED',
            syncedAt: new Date().toISOString(),
          });
        }
        syncedCount++;
      } catch (err: any) {
        console.error('Failed to sync offline order:', err);
        failedCount++;
        if (order.id) {
          await db.offlineOrders.update(order.id, {
            status: 'FAILED',
            error: err?.message || 'Sync failed',
          });
        }
      }
    }

    this.notify();
    return { synced: syncedCount, failed: failedCount };
  }
}

export const SyncService = new SyncServiceManager();
