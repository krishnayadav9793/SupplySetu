import { PrismaClient, Role, PriceTier, SchemeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SupplySetu Database Seed...');

  // 1. Clean existing records in correct relation order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.retailer.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 2. Create Users
  console.log('👤 Seeding Users & Roles...');
  const adminUser = await prisma.user.create({
    data: {
      phone: '9893000001',
      name: 'Ramesh Gupta (Distribution Head)',
      passwordHash: defaultPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const salesmanUser = await prisma.user.create({
    data: {
      phone: '9893000002',
      name: 'Vikram Sharma (Beat Salesman)',
      passwordHash: defaultPassword,
      role: Role.SALESMAN,
      isActive: true,
    },
  });

  const retailerUser = await prisma.user.create({
    data: {
      phone: '9893000003',
      name: 'Anil Patel (Kirana Merchant)',
      passwordHash: defaultPassword,
      role: Role.RETAILER,
      isActive: true,
    },
  });

  // 3. Create Retailer Profile
  console.log('🏪 Seeding Retailer Profile (Jabalpur, MP)...');
  await prisma.retailer.create({
    data: {
      userId: retailerUser.id,
      shopName: 'Shri Ganesh Kirana & General Store',
      ownerName: 'Anil Patel',
      phone: '9893000003',
      address: 'Shop 14, Sarafa Chowk, Lordganj',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      pincode: '482002',
      gstNumber: '23AABCP1234D1Z5',
      creditLimit: 75000.0,
      outstandingBalance: 14200.0,
      priceTier: PriceTier.TIER_1,
      salesmanId: salesmanUser.id,
      isActive: true,
    },
  });

  // 4. Create FMCG Products
  console.log('📦 Seeding FMCG Products & Categories...');
  const productsData = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  const createdProducts: Record<string, any> = {};

  for (const item of productsData) {
    const { stock, minOrderQty, ...productInfo } = item;
    const prod = await prisma.product.create({
      data: {
        ...productInfo,
        inventory: {
          create: {
            stockQuantity: stock,
            minOrderQty: minOrderQty,
          },
        },
      },
    });
    createdProducts[prod.skuCode] = prod;
  }

  // 5. Create Promotional Schemes
  console.log('🎁 Seeding Active Schemes...');
  // Buy 10 Parle-G, Get 1 Free
  await prisma.scheme.create({
    data: {
      name: 'Parle-G 10+1 Dhamaka Scheme',
      schemeType: SchemeType.BUY_X_GET_Y_FREE,
      minQuantity: 10,
      freeQuantity: 1,
      discountPercent: 0,
      productId: createdProducts['PARLE-G-80G'].id,
      freeProductId: createdProducts['PARLE-G-80G'].id,
      isActive: true,
    },
  });

  // Buy 12 Maggi, Get 1 Free
  await prisma.scheme.create({
    data: {
      name: 'Maggi Monsoon 12+1 Retailer Deal',
      schemeType: SchemeType.BUY_X_GET_Y_FREE,
      minQuantity: 12,
      freeQuantity: 1,
      discountPercent: 0,
      productId: createdProducts['MAGGI-NOODLE-70G'].id,
      freeProductId: createdProducts['MAGGI-NOODLE-70G'].id,
      isActive: true,
    },
  });

  // Surf Excel 5% Volume Discount on 5+ boxes
  await prisma.scheme.create({
    data: {
      name: 'Surf Excel 5% Bulk Discount Scheme',
      schemeType: SchemeType.PERCENTAGE_DISCOUNT,
      minQuantity: 5,
      freeQuantity: 0,
      discountPercent: 5.0,
      productId: createdProducts['SURF-EXCEL-500G'].id,
      isActive: true,
    },
  });

  console.log('✅ SupplySetu Database Seed Completed Successfully!');
  console.log('--------------------------------------------------');
  console.log('Test Accounts (Password for all: password123):');
  console.log('1. Admin:    Phone 9893000001 (Ramesh Gupta - Jabalpur Distribution)');
  console.log('2. Salesman: Phone 9893000002 (Vikram Sharma - Beat Salesman)');
  console.log('3. Retailer: Phone 9893000003 (Anil Patel - Shri Ganesh Kirana)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
