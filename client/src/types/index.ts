export type Role = 'ADMIN' | 'SALESMAN' | 'RETAILER';

export type PriceTier = 'STANDARD' | 'TIER_1' | 'TIER_2' | 'WHOLESALE';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  retailer?: RetailerProfile | null;
}

export interface RetailerProfile {
  id?: string;
  userId?: string;
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
  availableCredit?: number;
  creditUtilization?: number;
  priceTier?: PriceTier;
  salesman?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export interface ProductPricing {
  rate: number;
  mrp: number;
  marginPercent: number;
  tier: PriceTier;
  tierDiscountPercent: number;
  gstRate: number;
  gstAmount: number;
  totalWithGst: number;
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
  pricing?: ProductPricing;
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

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  freeQuantity: number;
  discountAmount: number;
  gstAmount: number;
  itemTotal: number;
}

export interface CategorySummary {
  name: string;
  count: number;
}
