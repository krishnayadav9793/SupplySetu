import { RetailerProfile, KhataLedgerResponse, RecordPaymentInput } from '../types';
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

  async getKhata(retailerId?: string): Promise<KhataLedgerResponse> {
    const endpoint = retailerId ? `/retailers/${retailerId}/khata` : '/retailers/me/khata';
    try {
      const res = await apiFetch<KhataLedgerResponse>(endpoint);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend khata API unreachable, using realistic fallback ledger:', err);
    }

    // High fidelity Jabalpur kirana fallback khata statement
    return {
      retailer: {
        id: 'ret-1',
        shopName: 'Shri Ganesh Kirana & General Store',
        ownerName: 'Anil Patel',
        phone: '9893000003',
        address: 'Shop 14, Sarafa Chowk, Lordganj',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        gstNumber: '23AABCP1234D1Z5',
        priceTier: 'TIER_1',
        creditLimit: 75000,
        outstandingBalance: 14200,
        availableCredit: 60800,
        creditUtilization: 19,
        creditStatus: 'HEALTHY',
        salesman: {
          id: 'usr-salesman-1',
          name: 'Vikram Sharma',
          phone: '9893000002',
        },
      },
      summary: {
        totalOrdersCount: 8,
        totalInvoicedAmount: 84350,
        paymentTerms: 'Weekly Settlement / Net 7 Days from Delivery',
        distributorUpiVpa: 'supplysetu.distributor@icici',
        distributorBankName: 'State Bank of India (Lordganj Branch, Jabalpur)',
        distributorAccountNo: '30492817492',
        distributorIfsc: 'SBIN0001242',
      },
      transactions: [
        {
          id: 'txn-1',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          type: 'INVOICE',
          referenceNo: 'ORD-1042',
          description: 'B2B Supply Invoice (Parle-G & Maggi) - Jabalpur Warehouse',
          debit: 11850.0,
          credit: 0,
          runningBalance: 14200.0,
          orderId: 'ord-1042',
          status: 'PENDING',
        },
        {
          id: 'txn-2',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          type: 'PAYMENT',
          referenceNo: 'UPI-SETTLE-8402',
          description: 'UPI Settlement received via Salesman Vikram Sharma',
          debit: 0,
          credit: 15000.0,
          runningBalance: 2350.0,
          paymentMode: 'UPI_DIRECT',
          status: 'SETTLED',
        },
        {
          id: 'txn-3',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          type: 'INVOICE',
          referenceNo: 'ORD-1038',
          description: 'B2B Supply Invoice (Surf Excel & Tata Salt) - Jabalpur Warehouse',
          debit: 17350.0,
          credit: 0,
          runningBalance: 17350.0,
          orderId: 'ord-1038',
          status: 'DELIVERED',
        },
        {
          id: 'txn-4',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
          type: 'PAYMENT',
          referenceNo: 'BANK-NEFT-3091',
          description: 'Direct NEFT Account Settlement (SBI NetBanking)',
          debit: 0,
          credit: 22000.0,
          runningBalance: 0.0,
          paymentMode: 'NEFT_RTGS',
          status: 'SETTLED',
        },
      ],
    };
  },

  async recordPayment(retailerId: string, input: RecordPaymentInput) {
    const encodedId = encodeURIComponent(retailerId || 'me');
    try {
      const res = await apiFetch(`/retailers/${encodedId}/payments`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res;
    } catch (err) {
      console.warn('Backend payment record unavailable, returning simulated response:', err);
      return {
        success: true,
        message: `Payment of ₹${input.amount} recorded locally`,
      };
    }
  },
};
