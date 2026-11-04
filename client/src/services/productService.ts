import { Product, CategorySummary, PriceTier } from '../types';
import { apiFetch } from './api';

// Fallback / Offline mock catalogue conforming to the FMCG distributor specification
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p-parle-g-80g',
    skuCode: 'PARLE-G-80G',
    name: 'Parle-G Glucose Biscuit (80g x 72 Pack)',
    brand: 'Parle',
    category: 'Biscuits & Cookies',
    unit: 'BOX',
    packSize: '72 Packets / Box',
    mrp: 720.0,
    basePrice: 610.0,
    gstRate: 5.0,
    stock: 450,
    minOrderQty: 2,
    pricing: {
      rate: 597.8,
      mrp: 720.0,
      marginPercent: 17.0,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 5.0,
      gstAmount: 29.89,
      totalWithGst: 627.69,
    },
    scheme: {
      id: 'sch-1',
      name: 'Parle-G 10+1 Dhamaka Scheme',
      schemeType: 'BUY_X_GET_Y_FREE',
      minQuantity: 10,
      freeQuantity: 1,
      discountPercent: 0,
    },
  },
  {
    id: 'p-goodday-100g',
    skuCode: 'BRIT-GOODDAY-100G',
    name: 'Britannia Good Day Butter Cookies (100g x 48 Pack)',
    brand: 'Britannia',
    category: 'Biscuits & Cookies',
    unit: 'BOX',
    packSize: '48 Packets / Box',
    mrp: 960.0,
    basePrice: 815.0,
    gstRate: 18.0,
    stock: 220,
    minOrderQty: 1,
    pricing: {
      rate: 798.7,
      mrp: 960.0,
      marginPercent: 16.8,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 18.0,
      gstAmount: 143.77,
      totalWithGst: 942.47,
    },
  },
  {
    id: 'p-maggi-70g',
    skuCode: 'MAGGI-NOODLE-70G',
    name: 'Nestlé Maggi 2-Minute Masala Noodles (70g x 96 Pack)',
    brand: 'Nestlé',
    category: 'Instant Noodles & Pasta',
    unit: 'CASE',
    packSize: '96 Packets / Case',
    mrp: 1344.0,
    basePrice: 1150.0,
    gstRate: 12.0,
    stock: 310,
    minOrderQty: 1,
    pricing: {
      rate: 1127.0,
      mrp: 1344.0,
      marginPercent: 16.1,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 12.0,
      gstAmount: 135.24,
      totalWithGst: 1262.24,
    },
    scheme: {
      id: 'sch-2',
      name: 'Maggi Monsoon 12+1 Retailer Deal',
      schemeType: 'BUY_X_GET_Y_FREE',
      minQuantity: 12,
      freeQuantity: 1,
      discountPercent: 0,
    },
  },
  {
    id: 'p-tata-salt-1kg',
    skuCode: 'TATA-SALT-1KG',
    name: 'Tata Salt Vacuum Evaporated (1kg x 24 Pack)',
    brand: 'Tata Consumer',
    category: 'Staples & Spices',
    unit: 'CASE',
    packSize: '24 Bags / Case',
    mrp: 672.0,
    basePrice: 580.0,
    gstRate: 5.0,
    stock: 180,
    minOrderQty: 2,
    pricing: {
      rate: 568.4,
      mrp: 672.0,
      marginPercent: 15.4,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 5.0,
      gstAmount: 28.42,
      totalWithGst: 596.82,
    },
  },
  {
    id: 'p-fortune-soya-1l',
    skuCode: 'FORTUNE-SOYA-1L',
    name: 'Fortune Refined Soyabean Oil (1L Pouch x 12 Pack)',
    brand: 'Fortune Adani',
    category: 'Edible Oils',
    unit: 'BOX',
    packSize: '12 Pouches / Box',
    mrp: 1680.0,
    basePrice: 1475.0,
    gstRate: 5.0,
    stock: 140,
    minOrderQty: 1,
    pricing: {
      rate: 1445.5,
      mrp: 1680.0,
      marginPercent: 13.9,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 5.0,
      gstAmount: 72.28,
      totalWithGst: 1517.78,
    },
  },
  {
    id: 'p-surf-excel-500g',
    skuCode: 'SURF-EXCEL-500G',
    name: 'Surf Excel Easy Wash Detergent Powder (500g x 36 Pack)',
    brand: 'Hindustan Unilever',
    category: 'Laundry & Fabric Care',
    unit: 'BOX',
    packSize: '36 Packs / Box',
    mrp: 2340.0,
    basePrice: 1980.0,
    gstRate: 18.0,
    stock: 95,
    minOrderQty: 1,
    pricing: {
      rate: 1940.4,
      mrp: 2340.0,
      marginPercent: 17.1,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 18.0,
      gstAmount: 349.27,
      totalWithGst: 2289.67,
    },
    scheme: {
      id: 'sch-3',
      name: 'Surf Excel 5% Bulk Discount Scheme',
      schemeType: 'PERCENTAGE_DISCOUNT',
      minQuantity: 5,
      freeQuantity: 0,
      discountPercent: 5.0,
    },
  },
  {
    id: 'p-lifebuoy-100g',
    skuCode: 'LIFEBUOY-SOAP-100G',
    name: 'Lifebuoy Total Germ Protection Soap (100g x 60 Pack)',
    brand: 'Hindustan Unilever',
    category: 'Soaps & Hygiene',
    unit: 'BOX',
    packSize: '60 Bars / Box',
    mrp: 1800.0,
    basePrice: 1520.0,
    gstRate: 18.0,
    stock: 260,
    minOrderQty: 1,
    pricing: {
      rate: 1489.6,
      mrp: 1800.0,
      marginPercent: 17.2,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 18.0,
      gstAmount: 268.13,
      totalWithGst: 1757.73,
    },
  },
  {
    id: 'p-dettol-hw-200ml',
    skuCode: 'DETTOL-HW-200ML',
    name: 'Dettol Original Liquid Handwash Pump (200ml x 24 Pack)',
    brand: 'Reckitt',
    category: 'Soaps & Hygiene',
    unit: 'BOX',
    packSize: '24 Bottles / Box',
    mrp: 2376.0,
    basePrice: 1995.0,
    gstRate: 18.0,
    stock: 85,
    minOrderQty: 1,
    pricing: {
      rate: 1955.1,
      mrp: 2376.0,
      marginPercent: 17.7,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 18.0,
      gstAmount: 351.92,
      totalWithGst: 2307.02,
    },
  },
  {
    id: 'p-colgate-150g',
    skuCode: 'COLGATE-MAX-150G',
    name: 'Colgate Strong Teeth Dental Cream (150g x 48 Pack)',
    brand: 'Colgate-Palmolive',
    category: 'Oral Care',
    unit: 'CASE',
    packSize: '48 Tubes / Case',
    mrp: 4560.0,
    basePrice: 3870.0,
    gstRate: 18.0,
    stock: 110,
    minOrderQty: 1,
    pricing: {
      rate: 3792.6,
      mrp: 4560.0,
      marginPercent: 16.8,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 18.0,
      gstAmount: 682.67,
      totalWithGst: 4475.27,
    },
  },
  {
    id: 'p-haldiram-400g',
    skuCode: 'HALDIRAM-BHUJIA-400G',
    name: 'Haldiram Nagpur Plain Bhujia (400g x 20 Pack)',
    brand: 'Haldiram',
    category: 'Packaged Snacks',
    unit: 'BOX',
    packSize: '20 Packs / Box',
    mrp: 2400.0,
    basePrice: 2040.0,
    gstRate: 12.0,
    stock: 190,
    minOrderQty: 1,
    pricing: {
      rate: 1999.2,
      mrp: 2400.0,
      marginPercent: 16.7,
      tier: 'TIER_1',
      tierDiscountPercent: 2.0,
      gstRate: 12.0,
      gstAmount: 239.9,
      totalWithGst: 2239.1,
    },
  },
];

export interface FetchProductsFilter {
  search?: string;
  category?: string;
  brand?: string;
  inStockOnly?: boolean;
  tier?: PriceTier;
}

export const ProductService = {
  async getProducts(filter: FetchProductsFilter = {}): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (filter.search) params.append('q', filter.search);
      if (filter.category && filter.category !== 'All') params.append('category', filter.category);
      if (filter.brand && filter.brand !== 'All') params.append('brand', filter.brand);
      if (filter.inStockOnly) params.append('inStock', 'true');
      if (filter.tier) params.append('tier', filter.tier);

      const res = await apiFetch<{ products: Product[] }>(`/products?${params.toString()}`);
      if (res.success && res.data.products) {
        return res.data.products;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using offline cached catalogue:', err);
    }

    // Filter fallback products locally
    let list = [...FALLBACK_PRODUCTS];

    if (filter.search && filter.search.trim() !== '') {
      const term = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.skuCode.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    if (filter.category && filter.category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    // Re-adjust tier pricing if user tier is different
    if (filter.tier) {
      const tierDiscountMap: Record<PriceTier, number> = {
        STANDARD: 0.0,
        TIER_1: 2.0,
        TIER_2: 4.0,
        WHOLESALE: 6.5,
      };
      const discount = tierDiscountMap[filter.tier] || 0;
      list = list.map((p) => {
        const rate = Math.round((p.basePrice * (1 - discount / 100)) * 100) / 100;
        const marginPercent = Math.round(((p.mrp - rate) / p.mrp) * 1000) / 10;
        const gstAmount = Math.round(((rate * p.gstRate) / 100) * 100) / 100;
        return {
          ...p,
          pricing: {
            rate,
            mrp: p.mrp,
            marginPercent,
            tier: filter.tier!,
            tierDiscountPercent: discount,
            gstRate: p.gstRate,
            gstAmount,
            totalWithGst: Math.round((rate + gstAmount) * 100) / 100,
          },
        };
      });
    }

    return list;
  },

  async getCategories(): Promise<CategorySummary[]> {
    try {
      const res = await apiFetch<CategorySummary[]>('/products/categories');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, compiling categories from offline cache');
    }

    // Generate categories from fallback
    const counts: Record<string, number> = {};
    for (const p of FALLBACK_PRODUCTS) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await apiFetch<Product>(`/products/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using offline product item');
    }

    return FALLBACK_PRODUCTS.find((p) => p.id === id || p.skuCode === id) || null;
  },
};
