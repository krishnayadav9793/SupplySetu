import { RetailerProfile } from '../types';
import { apiFetch } from './api';

export const RetailerService = {
  async getMyProfile(): Promise<RetailerProfile | null> {
    try {
      const res = await apiFetch<RetailerProfile>('/retailers/me');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local retailer profile:', err);
    }

    // Default Jabalpur demo retailer profile
    return {
      id: 'ret-1',
      shopName: 'Shri Ganesh Kirana Store',
      ownerName: 'Anil Patel',
      phone: '9893000003',
      address: 'Shop 14, Sarafa Chowk, Lordganj',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      pincode: '482002',
      gstNumber: '23AABCP1234D1Z5',
      creditLimit: 75000,
      outstandingBalance: 14200,
      availableCredit: 60800,
      creditUtilization: 19,
      priceTier: 'TIER_1',
      salesman: {
        id: 'usr-salesman-1',
        name: 'Vikram Sharma',
        phone: '9893000002',
      },
    };
  },

  async getAllRetailers(): Promise<RetailerProfile[]> {
    try {
      const res = await apiFetch<{ retailers: RetailerProfile[] }>('/retailers');
      if (res.success && res.data?.retailers) {
        return res.data.retailers;
      }
    } catch (err) {
      console.warn('Backend API unavailable, returning demo retailers');
    }

    return [
      {
        id: 'ret-1',
        shopName: 'Shri Ganesh Kirana Store',
        ownerName: 'Anil Patel',
        phone: '9893000003',
        address: 'Shop 14, Sarafa Chowk, Lordganj',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        creditLimit: 75000,
        outstandingBalance: 14200,
        availableCredit: 60800,
        creditUtilization: 19,
        priceTier: 'TIER_1',
      },
      {
        id: 'ret-2',
        shopName: 'Jai Maa Provision & Dairy',
        ownerName: 'Sunil Agrawal',
        phone: '9893000004',
        address: 'Wright Town, Near Stadium',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        creditLimit: 50000,
        outstandingBalance: 32000,
        availableCredit: 18000,
        creditUtilization: 64,
        priceTier: 'STANDARD',
      },
      {
        id: 'ret-3',
        shopName: 'Mahakaushal Wholesale Mart',
        ownerName: 'Rajesh Jain',
        phone: '9893000005',
        address: 'Gol Bazar, Ganjipura',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        creditLimit: 200000,
        outstandingBalance: 45000,
        availableCredit: 155000,
        creditUtilization: 23,
        priceTier: 'WHOLESALE',
      },
    ];
  },
};
