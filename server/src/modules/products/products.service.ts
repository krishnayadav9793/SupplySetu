import { PriceTier, Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { PricingService } from '../pricing/pricing.service';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  inStockOnly?: boolean;
  tier?: PriceTier;
  page?: number;
  limit?: number;
}

export class ProductsService {
  /**
   * Get products with inventory, active schemes, and tier-specific pricing.
   */
  static async getProducts(params: ProductQueryParams) {
    const {
      search,
      category,
      brand,
      inStockOnly = false,
      tier = PriceTier.STANDARD,
      page = 1,
      limit = 50,
    } = params;

    const skip = (Math.max(1, page) - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isAvailable: true,
    };

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { skuCode: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (brand && brand !== 'All') {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (inStockOnly) {
      where.inventory = {
        stockQuantity: { gt: 0 },
      };
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          inventory: true,
          schemes: {
            where: { isActive: true },
            take: 1,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products with personalized pricing and scheme highlights
    const formattedProducts = products.map((prod) => {
      const pricing = PricingService.calculatePrice(
        prod.basePrice,
        prod.mrp,
        prod.gstRate,
        tier
      );

      const activeScheme = prod.schemes.length > 0 ? prod.schemes[0] : null;

      return {
        id: prod.id,
        skuCode: prod.skuCode,
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        unit: prod.unit,
        packSize: prod.packSize,
        mrp: prod.mrp,
        basePrice: prod.basePrice,
        gstRate: prod.gstRate,
        stock: prod.inventory?.stockQuantity ?? 0,
        minOrderQty: prod.inventory?.minOrderQty ?? 1,
        pricing: {
          rate: pricing.dealerPrice,
          mrp: pricing.mrp,
          marginPercent: pricing.marginPercent,
          tier: pricing.tier,
          tierDiscountPercent: pricing.discountPercent,
          gstRate: pricing.gstRate,
          gstAmount: pricing.gstAmount,
          totalWithGst: pricing.totalWithGst,
        },
        scheme: activeScheme
          ? {
              id: activeScheme.id,
              name: activeScheme.name,
              schemeType: activeScheme.schemeType,
              minQuantity: activeScheme.minQuantity,
              freeQuantity: activeScheme.freeQuantity,
              discountPercent: activeScheme.discountPercent,
            }
          : null,
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get single product by ID or SKU
   */
  static async getProductById(id: string, tier: PriceTier = PriceTier.STANDARD) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { skuCode: id }],
        isAvailable: true,
      },
      include: {
        inventory: true,
        schemes: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new Error(`Product not found with id ${id}`);
    }

    const pricing = PricingService.calculatePrice(
      product.basePrice,
      product.mrp,
      product.gstRate,
      tier
    );

    return {
      id: product.id,
      skuCode: product.skuCode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      packSize: product.packSize,
      mrp: product.mrp,
      basePrice: product.basePrice,
      gstRate: product.gstRate,
      stock: product.inventory?.stockQuantity ?? 0,
      minOrderQty: product.inventory?.minOrderQty ?? 1,
      pricing: {
        rate: pricing.dealerPrice,
        mrp: pricing.mrp,
        marginPercent: pricing.marginPercent,
        tier: pricing.tier,
        tierDiscountPercent: pricing.discountPercent,
        gstRate: pricing.gstRate,
        gstAmount: pricing.gstAmount,
        totalWithGst: pricing.totalWithGst,
      },
      schemes: product.schemes,
    };
  }

  /**
   * Get all distinct categories with item counts
   */
  static async getCategories() {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      where: {
        isAvailable: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map((cat) => ({
      name: cat.category,
      count: cat._count.id,
    }));
  }

  /**
   * Get all distinct brands
   */
  static async getBrands() {
    const brands = await prisma.product.groupBy({
      by: ['brand'],
      _count: {
        id: true,
      },
      where: {
        isAvailable: true,
      },
      orderBy: {
        brand: 'asc',
      },
    });

    return brands.map((b) => ({
      name: b.brand,
      count: b._count.id,
    }));
  }
}
