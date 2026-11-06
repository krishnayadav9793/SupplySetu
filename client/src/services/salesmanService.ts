import { apiFetch } from './api';

export interface SalesmanRecord {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  assignedShopsCount: number;
  ordersCount: number;
  shops?: Array<{
    id: string;
    shopName: string;
    ownerName: string;
    address: string;
    city: string;
    outstandingBalance: number;
  }>;
}

export interface CreateSalesmanData {
  name: string;
  phone: string;
  password?: string;
  assignedRetailerIds?: string[];
}

export const SalesmanService = {
  async listSalesmen(): Promise<SalesmanRecord[]> {
    try {
      const res = await apiFetch<SalesmanRecord[]>('/salesmen');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local salesmen list:', err);
    }

    return [
      {
        id: 'usr-salesman-1',
        name: 'Vikram Sharma',
        phone: '9893000002',
        isActive: true,
        createdAt: new Date().toISOString(),
        assignedShopsCount: 5,
        ordersCount: 14,
      },
    ];
  },

  async createSalesman(data: CreateSalesmanData): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await apiFetch<any>('/salesmen', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: res.success,
        data: res.data,
        message: res.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to create salesman',
      };
    }
  },

  async assignShops(salesmanId: string, retailerIds: string[]): Promise<boolean> {
    try {
      const res = await apiFetch<any>('/salesmen/assign-shops', {
        method: 'POST',
        body: JSON.stringify({ salesmanId, retailerIds }),
      });
      return res.success;
    } catch (err) {
      return false;
    }
  },
};
