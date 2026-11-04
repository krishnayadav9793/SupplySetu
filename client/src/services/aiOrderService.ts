import { ValidatedAiOrderCaptureResult, SamplePrompt } from '../types';
import { apiFetch } from './api';
import { ProductService } from './productService';

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: 'Kirana Morning Rush',
    message: 'Bhaiya 10 peti Parle G, 5 case Maggi noodle, 2 peti Tata namak jaldi bhej dena kal subah',
    description: 'Fast-moving biscuits, instant noodles, and salt staple order',
  },
  {
    title: 'Colloquial Hinglish Order',
    message: '5 peti chhota biscuit, 2 peti washing powder, 3 box refined tel, aur 2 case colgate',
    description: 'Colloquial Kirana phrases (chhota biscuit, peti, washing powder, tel)',
  },
  {
    title: 'Home Care & Hygiene Top-up',
    message: 'Surf Excel 500g 5 peti, Lifebuoy sabun 3 box, Dettol handwash 2 peti',
    description: 'Bulk laundry & soap order qualifying for scheme discounts',
  },
];

export const AiOrderService = {
  async captureOrder(message: string): Promise<ValidatedAiOrderCaptureResult> {
    try {
      const res = await apiFetch<ValidatedAiOrderCaptureResult>('/ai/order-capture', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend AI service unreachable, running offline Kirana NLP Parser:', err);
    }

    // Offline / fallback processing using local catalogue
    return this.parseLocally(message);
  },

  async getSamplePrompts(): Promise<SamplePrompt[]> {
    try {
      const res = await apiFetch<SamplePrompt[]>('/ai/samples');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      // ignore, return default samples
    }
    return SAMPLE_PROMPTS;
  },

  async parseLocally(message: string): Promise<ValidatedAiOrderCaptureResult> {
    const products = await ProductService.getProducts();
    const tokens = message
      .split(/[,;\n\r+]+|(?:\band\b)|(?:\baur\b)/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const items: any[] = [];
    const unrecognized: string[] = [];

    const hindiNumbers: Record<string, number> = {
      ek: 1,
      do: 2,
      teen: 3,
      char: 4,
      chaar: 4,
      paanch: 5,
      panch: 5,
      chhe: 6,
      saat: 7,
      aath: 8,
      nau: 9,
      das: 10,
      barah: 12,
      pandrah: 15,
      bees: 20,
    };

    const rules = [
      { sku: 'PARLE-G-80G', patterns: [/parle[-\s]?g/i, /glucose/i, /chhot[ae]\s*biscuit/i, /biscuit/i] },
      { sku: 'BRIT-GOODDAY-100G', patterns: [/good[-\s]?day/i, /butter\s*biscuit/i, /britannia/i] },
      { sku: 'MAGGI-NOODLE-70G', patterns: [/maggi/i, /maggie/i, /noodle/i, /2[-\s]?minute/i] },
      { sku: 'SURF-EXCEL-500G', patterns: [/surf[-\s]?excel/i, /surf/i, /washing\s*powder/i, /detergent/i] },
      { sku: 'TATA-SALT-1KG', patterns: [/tata\s*salt/i, /namak/i, /salt/i] },
      { sku: 'FORTUNE-SOYA-1L', patterns: [/fortune/i, /soya/i, /tel/i, /refined/i, /oil/i] },
      { sku: 'LIFEBUOY-SOAP-100G', patterns: [/lifebuoy/i, /sabun/i, /soap/i] },
      { sku: 'DETTOL-HW-200ML', patterns: [/dettol/i, /handwash/i] },
      { sku: 'COLGATE-MAX-150G', patterns: [/colgate/i, /paste/i, /manjan/i] },
      { sku: 'HALDIRAM-BHUJIA-400G', patterns: [/bhujia/i, /haldiram/i, /namkeen/i] },
    ];

    let totalEstimated = 0;
    let totalUnits = 0;
    let hasStockWarnings = false;

    for (const token of tokens) {
      let quantity = 1;
      const numMatch = token.match(/\b(\d+)\b/);
      if (numMatch) {
        quantity = parseInt(numMatch[1], 10);
      } else {
        const words = token.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (hindiNumbers[w]) {
            quantity = hindiNumbers[w];
            break;
          }
        }
      }

      let matchedSku: string | null = null;
      for (const rule of rules) {
        for (const pat of rule.patterns) {
          if (pat.test(token)) {
            matchedSku = rule.sku;
            break;
          }
        }
        if (matchedSku) break;
      }

      if (matchedSku) {
        const prod = products.find((p) => p.skuCode === matchedSku);
        if (prod) {
          const rate = prod.pricing?.rate || prod.basePrice;
          const isAvail = prod.stock > 0;
          let stockWarning: string | null = null;
          if (prod.stock === 0) {
            stockWarning = 'Out of stock in Jabalpur warehouse';
            hasStockWarnings = true;
          } else if (quantity > prod.stock) {
            stockWarning = `Only ${prod.stock} ${prod.unit}s available (requested ${quantity})`;
            hasStockWarnings = true;
          }

          const confirmedQty = isAvail ? (quantity > prod.stock ? prod.stock : quantity) : 0;
          const subtotal = rate * quantity;
          const gstAmount = (subtotal * (prod.gstRate || 18)) / 100;
          const itemTotal = subtotal + gstAmount;

          totalEstimated += itemTotal;
          totalUnits += quantity;

          const alternatives = products
            .filter((p) => p.id !== prod.id && p.category === prod.category)
            .slice(0, 2)
            .map((alt) => ({
              sku: alt.skuCode,
              productName: alt.name,
              brand: alt.brand,
              rate: alt.pricing?.rate || alt.basePrice,
              stock: alt.stock,
              confidence: 0.78,
            }));

          items.push({
            rawText: token,
            sku: prod.skuCode,
            productName: prod.name,
            brand: prod.brand,
            category: prod.category,
            packSize: prod.packSize,
            requestedQuantity: quantity,
            confirmedQuantity: confirmedQty,
            unit: prod.unit,
            unitPrice: rate,
            mrp: prod.mrp,
            gstRate: prod.gstRate,
            itemTotal: Math.round(itemTotal * 100) / 100,
            stockAvailable: prod.stock,
            isAvailable: isAvail,
            stockWarning,
            confidence: 0.96,
            confidenceLevel: 'HIGH',
            reasoning: `Extracted "${token}" -> mapped to ${prod.name}`,
            alternatives,
          });
          continue;
        }
      }

      if (!/bhaiya|namaste|order|urgent|morning|delivery|bhejo/i.test(token) || token.length > 8) {
        unrecognized.push(token);
      }
    }

    return {
      originalMessage: message,
      parsedAt: new Date().toISOString(),
      languageDetected: 'Hindi / Hinglish (Offline Kirana Engine)',
      items,
      unrecognizedItems: unrecognized,
      totalEstimatedAmount: Math.round(totalEstimated * 100) / 100,
      totalUnitsCount: totalUnits,
      hasStockWarnings,
      hasLowConfidenceItems: false,
    };
  },
};
