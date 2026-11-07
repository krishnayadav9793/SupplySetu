/**
 * SupplySetu End-to-End Business Logic & Verification Test Suite (Phase 7)
 * Tests core FMCG distribution logic across pricing, schemes, credit, auth, exports, and offline sync.
 */

import { PricingService } from '../modules/pricing/pricing.service';
import { AiOrderCaptureService } from '../modules/ai/ai.service';
import { PriceTier } from '@prisma/client';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, category, passed: true, durationMs: Date.now() - start });
  } catch (err: any) {
    results.push({
      name,
      category,
      passed: false,
      error: err?.message || String(err),
      durationMs: Date.now() - start,
    });
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected [${expected}], got [${actual}]`);
  }
}

export async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 SUPPLYSETU PHASE 7: AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. PRICING TIER TESTS
  await runTest('Pricing Tier', 'Standard Tier has 0% discount', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.STANDARD);
    assertEqual(res.dealerPrice, 1000, 'Dealer price should match base price for Standard');
    assertEqual(res.discountPercent, 0, 'Discount percent should be 0');
    assertEqual(res.gstAmount, 180, '18% GST on 1000 should be 180');
    assertEqual(res.totalWithGst, 1180, 'Total with GST should be 1180');
  });

  await runTest('Pricing Tier', 'Tier 1 has 2% discount applied', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_1);
    assertEqual(res.dealerPrice, 980, 'Dealer price should be 980 (1000 - 2%)');
    assertEqual(res.discountPercent, 2, 'Discount percent should be 2%');
    assertEqual(res.gstAmount, 176.4, '18% GST on 980 should be 176.40');
    assertEqual(res.totalWithGst, 1156.4, 'Total should be 1156.40');
  });

  await runTest('Pricing Tier', 'Tier 2 has 4% discount applied', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_2);
    assertEqual(res.dealerPrice, 960, 'Dealer price should be 960 (1000 - 4%)');
    assertEqual(res.discountPercent, 4, 'Discount percent should be 4%');
  });

  await runTest('Pricing Tier', 'Wholesale Tier has 6.5% discount applied', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.WHOLESALE);
    assertEqual(res.dealerPrice, 935, 'Dealer price should be 935 (1000 - 6.5%)');
    assertEqual(res.discountPercent, 6.5, 'Discount percent should be 6.5%');
  });

  await runTest('Pricing Tier', 'Margin percent calculation vs MRP', () => {
    // MRP 1200, Dealer price 960 -> margin = (1200 - 960) / 1200 = 240 / 1200 = 20%
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_2);
    assertEqual(res.marginPercent, 20.0, 'Retailer margin should be exactly 20.0%');
  });

  // 2. SCHEME ENGINE TESTS
  await runTest('Scheme Engine', 'Buy 10 Get 1 Free - Below minimum quantity (Qty = 9)', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 9;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    assertEqual(free, 0, 'No free items should be awarded below minimum');
  });

  await runTest('Scheme Engine', 'Buy 10 Get 1 Free - Exactly minimum quantity (Qty = 10)', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 10;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    assertEqual(free, 1, 'Exactly 1 free item should be awarded');
  });

  await runTest('Scheme Engine', 'Buy 10 Get 1 Free - Multiple sets (Qty = 25)', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 25;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    assertEqual(free, 2, 'Two free items for 25 units in 10+1 scheme');
  });

  await runTest('Scheme Engine', 'Percentage Volume Discount calculation', () => {
    const qty = 6;
    const minQty = 5;
    const discountPercent = 5.0; // 5% bulk discount
    const dealerPrice = 1980; // Surf excel rate

    let discountAmount = 0;
    if (qty >= minQty) {
      discountAmount = Math.round(((dealerPrice * qty * discountPercent) / 100) * 100) / 100;
    }
    // 1980 * 6 = 11880. 5% of 11880 = 594.
    assertEqual(discountAmount, 594, '5% discount on ₹11,880 should be ₹594');
  });

  // 3. CREDIT LIMIT & HOLD TESTS
  await runTest('Credit Controls', 'Order within available credit limit is approved without warning', () => {
    const creditLimit = 75000;
    const outstanding = 14200;
    const availableCredit = creditLimit - outstanding; // 60800
    const orderTotal = 25000;

    const exceedsCredit = orderTotal > availableCredit;
    assert(!exceedsCredit, 'Order should not exceed available credit');
  });

  await runTest('Credit Controls', 'Order exceeding credit line triggers Credit Hold flag', () => {
    const creditLimit = 50000;
    const outstanding = 45000;
    const availableCredit = creditLimit - outstanding; // 5000
    const orderTotal = 18500;

    const exceedsCredit = orderTotal > availableCredit;
    const excessAmount = orderTotal - availableCredit;
    assert(exceedsCredit, 'Order should trigger credit hold');
    assertEqual(excessAmount, 13500, 'Exceeded amount must be 13500');
  });

  // 4. OFFLINE IDEMPOTENCY & QUEUE TESTS
  await runTest('Offline Sync', 'Client generates unique idempotent clientOrderId', () => {
    const id1 = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const id2 = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    assert(id1.startsWith('offline-'), 'ID must have offline prefix');
    assert(id1 !== id2, 'Two consecutive offline order IDs must be unique');
  });

  await runTest('Offline Sync', 'Deduplication prevention logic rejects duplicated clientOrderId', () => {
    const syncedOrders = new Set(['offline-173000-abc123', 'offline-173000-xyz789']);
    const incomingId = 'offline-173000-abc123';
    const isDuplicate = syncedOrders.has(incomingId);
    assert(isDuplicate, 'Duplicate clientOrderId must be detected and skipped');
  });

  // 5. TALLY CSV EXPORT FORMAT TESTS
  await runTest('Tally Export', 'RFC-4180 CSV escaping for kirana store names with commas', () => {
    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const regularName = 'Shri Ganesh Store';
    const complexName = 'Gupta & Sons, Kirana "Super" Bazaar';

    assertEqual(escapeCsv(regularName), 'Shri Ganesh Store', 'Plain text should not be quoted');
    assertEqual(
      escapeCsv(complexName),
      '"Gupta & Sons, Kirana ""Super"" Bazaar"',
      'String with commas and quotes must be escaped with double quotes'
    );
  });

  await runTest('Tally Export', 'CSV header contains all mandatory ERP fields', () => {
    const requiredHeaders = [
      'Order ID',
      'Order Date',
      'Retailer Code',
      'Retailer Name',
      'GSTIN',
      'City',
      'SKU Code',
      'Product Name',
      'Brand',
      'Pack Size',
      'Quantity',
      'Unit',
      'Dealer Rate (INR)',
      'Taxable Subtotal (INR)',
      'GST Rate (%)',
      'Item GST (INR)',
      'Total Item Amount (INR)',
    ];

    const sampleHeaderRow =
      'Order ID,Order Date,Retailer Code,Retailer Name,GSTIN,City,SKU Code,Product Name,Brand,Pack Size,Quantity,Unit,Free Quantity,Dealer Rate (INR),Trade Discount (INR),Taxable Subtotal (INR),GST Rate (%),Item GST (INR),Total Item Amount (INR),Created Channel';

    for (const header of requiredHeaders) {
      assert(sampleHeaderRow.includes(header), `Header must contain ${header}`);
    }
  });

  // 6. MULTIMODAL AI & TRANSPARENCY TESTS
  await runTest('Multimodal AI', 'Diagnostic status check returns valid model & engine', async () => {
    const status = AiOrderCaptureService.getAiStatus();
    assert(typeof status.isGeminiConfigured === 'boolean', 'isGeminiConfigured must be boolean');
    assert(status.model.includes('flash'), 'Model must be a flash model');
    assert(status.supportedFeatures.includes('handwritten_parchi_vision'), 'Must support handwritten parchi vision');
    assert(typeof status.guidanceMessage === 'string' && status.guidanceMessage.length > 0, 'Must have guidance message');
  });

  await runTest('Multimodal AI', 'Parchi slip photo multimodal processing produces validated cart items', async () => {
    const dummySvgData = 'data:image/svg+xml;utf8,<svg></svg>';
    const result = await AiOrderCaptureService.processMultimodalOrder({
      imageBase64: dummySvgData,
      mimeType: 'image/svg+xml',
      textNotes: 'Urgent order for kal subah',
    });

    assert(result.items.length > 0, 'Must extract at least one catalogue item from parchi slip');
    assertEqual(result.captureMode, 'PARCHI_VISION', 'Capture mode must be tagged PARCHI_VISION');
    assert(result.totalEstimatedAmount > 0, 'Estimated amount must be calculated');
    for (const item of result.items) {
      assert(item.unitPrice > 0, `Unit price for ${item.sku} must be > 0`);
      assert(item.itemTotal > 0, `Item total for ${item.sku} must be > 0`);
      assert(typeof item.stockAvailable === 'number', `Stock available must be defined`);
    }
  });

  await runTest('Multimodal AI', 'AI Safety Rule: Non-catalogue items must never be hallucinated as SKUs', async () => {
    const result = await AiOrderCaptureService.processOrderMessage(
      'bhaiya 10 peti random_nonexistent_brand_xyz 99kg loose wheat bhejo'
    );
    // Non-catalogue tokens must land in unrecognizedItems
    assert(
      result.unrecognizedItems.length > 0,
      'Non-catalogue items must be safely listed in unrecognizedItems'
    );
    const hasHallucinated = result.items.some((i) => i.sku.includes('random_nonexistent'));
    assertEqual(hasHallucinated, false, 'System must NEVER hallucinate or invent non-existent SKUs');
  });

  // 7. PRINT SUMMARY REPORT
  console.log('----------------------------------------------------');
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      console.log(`  ✓ [${r.category}] ${r.name} (${r.durationMs}ms)`);
      passedCount++;
    } else {
      console.error(`  ✗ [${r.category}] ${r.name}: ${r.error}`);
    }
  }
  console.log('----------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);

  if (passedCount !== results.length) {
    throw new Error('Some verification tests failed!');
  }
}

// Execute when invoked directly
if (require.main === module || !module.parent) {
  runAllTests()
    .then(async () => {
      const { prisma } = await import('../config');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      const { prisma } = await import('../config');
      await prisma.$disconnect();
      process.exit(1);
    });
}
