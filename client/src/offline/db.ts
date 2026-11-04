import Dexie, { Table } from 'dexie';
import { Product, RetailerProfile } from '../types';

export interface OfflineOrderItem {
  productId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  freeQuantity?: number;
  totalPrice: number;
}

export interface OfflineOrderRecord {
  id?: number;
  clientOrderId: string; // Idempotency key (UUID)
  retailerId: string;
  retailerName: string;
  salesmanId?: string;
  items: OfflineOrderItem[];
  finalAmount: number;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  notes?: string;
  createdAt: string;
  syncedAt?: string;
  error?: string;
}

export class SupplySetuDatabase extends Dexie {
  cachedProducts!: Table<Product, string>;
  cachedRetailers!: Table<RetailerProfile, string>;
  offlineOrders!: Table<OfflineOrderRecord, number>;

  constructor() {
    super('SupplySetuOfflineDB');

    this.version(1).stores({
      cachedProducts: 'id, skuCode, name, brand, category',
      cachedRetailers: 'id, shopName, ownerName',
      offlineOrders: '++id, clientOrderId, retailerId, status, createdAt',
    });
  }
}

export const db = new SupplySetuDatabase();
