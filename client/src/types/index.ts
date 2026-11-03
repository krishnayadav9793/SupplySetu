export type Role = 'ADMIN' | 'SALESMAN' | 'RETAILER';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  retailer?: RetailerProfile | null;
}

export interface RetailerProfile {
  id?: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingBalance: number;
  priceTier?: 'STANDARD' | 'TIER_1' | 'TIER_2' | 'WHOLESALE';
}

export interface Product {
  id: string;
  skuCode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  packSize: string;
  mrp: number;
  basePrice: number;
  gstRate: number;
  stock: number;
  minOrderQty: number;
  scheme?: Scheme | null;
}

export interface Scheme {
  id: string;
  name: string;
  schemeType: 'BUY_X_GET_Y_FREE' | 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT';
  minQuantity: number;
  freeQuantity: number;
  discountPercent: number;
}
