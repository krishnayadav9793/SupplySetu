export type Role = 'ADMIN' | 'SALESMAN' | 'RETAILER';

export type PriceTier = 'STANDARD' | 'TIER_1' | 'TIER_2' | 'WHOLESALE';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  retailer?: RetailerProfile | null;
  salesman?: {
    id: string;
    name: string;
    phone: string;
    beatRoute?: string;
  } | null;
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
  productId?: string;
  freeProductId?: string | null;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
  createdAt?: string;
  product?: {
    id: string;
    skuCode: string;
    name: string;
    brand: string;
    category: string;
    unit?: string;
    basePrice?: number;
    mrp?: number;
  };
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
  engineUsed?: 'GEMINI_2_5_FLASH' | 'LOCAL_FMCG_PARSER';
  captureMode?: 'TEXT' | 'PARCHI_VISION' | 'VOICE';
}

export interface AiStatusResponse {
  isGeminiConfigured: boolean;
  model: string;
  activeEngine: 'GEMINI_2_5_FLASH' | 'LOCAL_FMCG_PARSER';
  supportedFeatures: string[];
  guidanceMessage: string;
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

export interface KhataTransaction {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  paymentMode?: string;
  orderId?: string;
  status: string;
}

export interface KhataLedgerResponse {
  retailer: {
    id: string;
    shopName: string;
    ownerName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    gstNumber?: string | null;
    priceTier: string;
    creditLimit: number;
    outstandingBalance: number;
    availableCredit: number;
    creditUtilization: number;
    creditStatus: 'HEALTHY' | 'WARNING' | 'OVERDUE_HOLD';
    salesman?: {
      id?: string;
      name: string;
      phone: string;
    } | null;
  };
  summary: {
    totalOrdersCount: number;
    totalInvoicedAmount: number;
    paymentTerms: string;
    distributorUpiVpa: string;
    distributorBankName: string;
    distributorAccountNo: string;
    distributorIfsc: string;
  };
  transactions: KhataTransaction[];
}

export interface RecordPaymentInput {
  amount: number;
  paymentMode?: string;
  referenceNo?: string;
  notes?: string;
}

// ----------------------------------------------------
// EXECUTIVE ANALYTICS, CHURN RADAR & FINANCIAL RISK (TASK 7)
// ----------------------------------------------------

export interface BrandContribution {
  brand: string;
  revenue: number;
  ordersCount: number;
  percentage: number;
}

export interface CategoryContribution {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopRetailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  creditLimit: number;
  outstandingBalance: number;
}

export interface ExecutiveAnalyticsData {
  kpi: {
    totalOrders: number;
    totalGmv: number;
    todayOrdersCount: number;
    todayGmv: number;
    aov: number;
    fulfillmentRate: number;
    activeRetailersCount: number;
  };
  statusDistribution: Record<string, number>;
  brandBreakdown: BrandContribution[];
  categoryBreakdown: CategoryContribution[];
  topRetailers: TopRetailer[];
}

export interface InactiveRetailerRecord {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  daysDormant: number;
  lastOrderDate: string | null;
  lastOrderAmount: number | null;
  totalHistoricalOrders: number;
  riskLevel: 'HIGH' | 'MEDIUM';
  salesmanId: string | null;
  salesmanName: string | null;
  suggestedWhatsAppMessage: string;
  whatsAppUrl: string;
}

export interface HighRiskCreditRetailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  utilizationPct: number;
  status: 'EXCEEDED' | 'WARNING' | 'HEALTHY';
  whatsappReminderUrl: string;
}

export interface FinancialRiskData {
  summary: {
    totalCreditExtended: number;
    totalOutstanding: number;
    availableCreditNetwork: number;
    overallUtilizationPct: number;
    overLimitRetailersCount: number;
    warningRetailersCount: number;
  };
  aging: {
    current0to15Days: number;
    overdue16to30Days: number;
    critical30PlusDays: number;
  };
  highRiskRetailers: HighRiskCreditRetailer[];
}

export interface SalesmanPerformanceRecord {
  id: string;
  name: string;
  phone: string;
  assignedShopsCount: number;
  ordersTodayCount: number;
  gmvToday: number;
  dailyTargetGmv: number;
  targetAchievementPct: number;
  strikeRatePct: number;
  monthOrdersCount: number;
  monthGmv: number;
}

