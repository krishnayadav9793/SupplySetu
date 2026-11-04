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

export interface AiAlternative {
  sku: string;
  productName: string;
  brand: string;
  rate: number;
  stock: number;
  confidence: number;
}

export interface ValidatedAiOrderItem {
  rawText: string;
  sku: string;
  productName: string;
  brand: string;
  category: string;
  packSize: string;
  requestedQuantity: number;
  confirmedQuantity: number;
  unit: string;
  unitPrice: number;
  mrp: number;
  gstRate: number;
  itemTotal: number;
  stockAvailable: number;
  isAvailable: boolean;
  stockWarning: string | null;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string;
  alternatives: AiAlternative[];
}

export interface ValidatedAiOrderCaptureResult {
  originalMessage: string;
  parsedAt: string;
  languageDetected: string;
  items: ValidatedAiOrderItem[];
  unrecognizedItems: string[];
  totalEstimatedAmount: number;
  totalUnitsCount: number;
  hasStockWarnings: boolean;
  hasLowConfidenceItems: boolean;
}

export interface SamplePrompt {
  title: string;
  message: string;
  description: string;
}

export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';

export interface OrderItemDetail {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  discountAmount: number;
  freeQuantity: number;
  totalPrice: number;
  product?: {
    name: string;
    skuCode: string;
    brand: string;
    packSize: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  retailerId: string;
  salesmanId?: string | null;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  gstAmount: number;
  finalAmount: number;
  notes?: string | null;
  createdVia: string;
  createdAt: string;
  creditStatus?: 'HOLD' | 'CLEARED';
  creditExcessAmount?: number;
  retailer: {
    id: string;
    shopName: string;
    ownerName: string;
    phone: string;
    city: string;
    creditLimit: number;
    outstandingBalance: number;
  };
  salesman?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  items: OrderItemDetail[];
  itemCount?: number;
  totalUnitsCount?: number;
  freeUnitsCount?: number;
}

export interface OrderDeskMetrics {
  totalOrdersToday: number;
  pendingOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  totalGmv: number;
  creditHoldCount: number;
  activeSalesmenCount: number;
}
