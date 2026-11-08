import { PriceTier, Prisma, SchemeType } from '@prisma/client';
import { prisma } from '../../config';
import { PricingService } from '../pricing/pricing.service';
import { eventBus } from '../notifications/events';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  inStockOnly?: boolean;
  tier?: PriceTier;
  page?: number;
  limit?: number;
}

export interface CreateProductInput {
  skuCode: string;
  name: string;
  brand: string;
  category: string;
  unit?: string;
  packSize: string;
  mrp: number;
  basePrice: number;
  gstRate?: number;
  stockQuantity?: number;
  minOrderQty?: number;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: string;
  unit?: string;
  packSize?: string;
  mrp?: number;
  basePrice?: number;
  gstRate?: number;
  isAvailable?: boolean;
  stockQuantity?: number;
  minOrderQty?: number;
}

export interface CreateSchemeInput {
  name: string;
  schemeType: SchemeType;
  productId: string;
  minQuantity: number;
  freeQuantity?: number;
  discountPercent?: number;
  startDate?: Date;
  endDate?: Date;
  freeProductId?: string;
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
      const pricing = PricingService.calculatePrice(prod.basePrice, prod.mrp, prod.gstRate, tier);

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

  /**
   * Create a new FMCG product and initialize warehouse stock
   */
  static async createProduct(input: CreateProductInput) {
    const {
      skuCode,
      name,
      brand,
      category,
      unit = 'BOX',
      packSize,
      mrp,
      basePrice,
      gstRate = 18.0,
      stockQuantity = 0,
      minOrderQty = 1,
    } = input;

    if (!skuCode || !name || !brand || !category) {
      throw new Error('SKU code, product name, brand, and category are required');
    }
    if (mrp <= 0 || basePrice <= 0) {
      throw new Error('MRP and base price must be positive numbers');
    }

    const cleanSku = skuCode.trim().toUpperCase();

    // Check duplicate SKU
    const existing = await prisma.product.findUnique({
      where: { skuCode: cleanSku },
    });
    if (existing) {
      throw new Error(`Product with SKU '${cleanSku}' already exists`);
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          skuCode: cleanSku,
          name: name.trim(),
          brand: brand.trim(),
          category: category.trim(),
          unit: unit.trim().toUpperCase(),
          packSize: packSize.trim(),
          mrp,
          basePrice,
          gstRate,
          isAvailable: true,
        },
      });

      await tx.inventory.create({
        data: {
          productId: created.id,
          stockQuantity: Math.max(0, stockQuantity),
          minOrderQty: Math.max(1, minOrderQty),
        },
      });

      return created;
    });

    return this.getProductById(product.id);
  }

  /**
   * Update existing FMCG product details and inventory
   */
  static async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });
    if (!existing) {
      throw new Error(`Product with id '${id}' not found`);
    }

    const {
      name,
      brand,
      category,
      unit,
      packSize,
      mrp,
      basePrice,
      gstRate,
      isAvailable,
      stockQuantity,
      minOrderQty,
    } = input;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(brand && { brand: brand.trim() }),
          ...(category && { category: category.trim() }),
          ...(unit && { unit: unit.trim().toUpperCase() }),
          ...(packSize && { packSize: packSize.trim() }),
          ...(mrp !== undefined && { mrp }),
          ...(basePrice !== undefined && { basePrice }),
          ...(gstRate !== undefined && { gstRate }),
          ...(isAvailable !== undefined && { isAvailable }),
        },
      });

      if (stockQuantity !== undefined || minOrderQty !== undefined) {
        await tx.inventory.upsert({
          where: { productId: id },
          create: {
            productId: id,
            stockQuantity: Math.max(0, stockQuantity ?? 0),
            minOrderQty: Math.max(1, minOrderQty ?? 1),
          },
          update: {
            ...(stockQuantity !== undefined && { stockQuantity: Math.max(0, stockQuantity) }),
            ...(minOrderQty !== undefined && { minOrderQty: Math.max(1, minOrderQty) }),
          },
        });
      }
    });

    return this.getProductById(id);
  }

  /**
   * Quick update of warehouse stock quantity & minimum order quantity
   */
  static async updateStock(id: string, stockQuantity: number, minOrderQty?: number) {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new Error(`Product with id '${id}' not found`);
    }

    const updated = await prisma.inventory.upsert({
      where: { productId: id },
      create: {
        productId: id,
        stockQuantity: Math.max(0, stockQuantity),
        minOrderQty: Math.max(1, minOrderQty ?? 1),
      },
      update: {
        stockQuantity: Math.max(0, stockQuantity),
        ...(minOrderQty !== undefined && { minOrderQty: Math.max(1, minOrderQty) }),
      },
    });

    eventBus.broadcast({
      type: 'STOCK_UPDATED',
      data: {
        productId: id,
        skuCode: product.skuCode,
        name: product.name,
        stockQuantity: updated.stockQuantity,
        minOrderQty: updated.minOrderQty,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });

    return {
      productId: id,
      stockQuantity: updated.stockQuantity,
      minOrderQty: updated.minOrderQty,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Deactivate or remove a product
   */
  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });
    if (!product) {
      throw new Error(`Product with id '${id}' not found`);
    }

    if (product._count.orderItems > 0) {
      // Soft-delete to preserve order history integrity
      await prisma.product.update({
        where: { id },
        data: { isAvailable: false },
      });
      return { message: 'Product archived (marked unavailable) because it has existing orders' };
    }

    await prisma.product.delete({
      where: { id },
    });
    return { message: 'Product deleted successfully' };
  }

  /**
   * List all promotional trade schemes with their primary products
   */
  static async listSchemes() {
    const schemes = await prisma.scheme.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            skuCode: true,
            name: true,
            brand: true,
            category: true,
            unit: true,
            basePrice: true,
            mrp: true,
          },
        },
      },
    });

    return schemes;
  }

  /**
   * Create a new trade scheme linked to an FMCG product
   */
  static async createScheme(input: CreateSchemeInput) {
    const {
      name,
      schemeType,
      productId,
      minQuantity,
      freeQuantity = 0,
      discountPercent = 0,
      startDate = new Date(),
      endDate,
      freeProductId,
    } = input;

    if (!name || !schemeType || !productId) {
      throw new Error('Scheme name, type, and product are required');
    }
    if (minQuantity < 1) {
      throw new Error('Minimum qualifying quantity must be at least 1');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new Error(`Product with id '${productId}' not found`);
    }

    if (schemeType === SchemeType.BUY_X_GET_Y_FREE && freeQuantity < 1) {
      throw new Error("Free quantity must be at least 1 for 'Buy X Get Y Free' schemes");
    }
    if (schemeType === SchemeType.PERCENTAGE_DISCOUNT && discountPercent <= 0) {
      throw new Error("Discount percent must be greater than 0 for 'Percentage Discount' schemes");
    }
    if (schemeType === SchemeType.FLAT_DISCOUNT && discountPercent <= 0) {
      throw new Error("Flat discount amount must be greater than 0 for 'Flat Discount' schemes");
    }

    const scheme = await prisma.scheme.create({
      data: {
        name: name.trim(),
        schemeType,
        productId,
        minQuantity,
        freeQuantity: schemeType === SchemeType.BUY_X_GET_Y_FREE ? freeQuantity : 0,
        discountPercent: schemeType !== SchemeType.BUY_X_GET_Y_FREE ? discountPercent : 0,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        freeProductId: freeProductId || productId,
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            skuCode: true,
            name: true,
            brand: true,
            category: true,
            unit: true,
            basePrice: true,
            mrp: true,
          },
        },
      },
    });

    return scheme;
  }

  /**
   * Toggle trade scheme active/inactive status
   */
  static async toggleSchemeStatus(id: string, isActive?: boolean) {
    const existing = await prisma.scheme.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`Scheme with id '${id}' not found`);
    }

    const newStatus = isActive !== undefined ? isActive : !existing.isActive;

    const updated = await prisma.scheme.update({
      where: { id },
      data: { isActive: newStatus },
      include: {
        product: {
          select: {
            id: true,
            skuCode: true,
            name: true,
            brand: true,
            category: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a trade scheme
   */
  static async deleteScheme(id: string) {
    const existing = await prisma.scheme.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`Scheme with id '${id}' not found`);
    }

    await prisma.scheme.delete({
      where: { id },
    });

    return { message: 'Scheme deleted successfully' };
  }
}
