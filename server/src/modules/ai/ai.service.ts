import { GoogleGenAI } from '@google/genai';
import { PriceTier } from '@prisma/client';
import { prisma } from '../../config';
import { PricingService } from '../pricing/pricing.service';
import {
  AiOrderExtractionSchema,
  AiOrderExtraction,
  ValidatedAiOrderCaptureResult,
  ValidatedAiOrderItem,
} from './ai.schema';

export class AiOrderCaptureService {
  /**
   * Main entry point: Process retailer's natural language order message
   */
  static async processOrderMessage(
    rawMessage: string,
    retailerTier: PriceTier = PriceTier.STANDARD
  ): Promise<ValidatedAiOrderCaptureResult> {
    const trimmedMessage = rawMessage.trim();
    if (!trimmedMessage) {
      throw new Error('Order message cannot be empty');
    }

    // 1. Fetch available product catalogue from database
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: {
        inventory: true,
        schemes: { where: { isActive: true }, take: 1 },
      },
    });

    // 2. Perform AI / LLM extraction
    let extraction: AiOrderExtraction;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        extraction = await this.extractWithGemini(trimmedMessage, products, apiKey);
      } catch (err) {
        console.warn('[AI Service] Gemini API call failed, using intelligent FMCG parser fallback:', err);
        extraction = this.extractWithLocalParser(trimmedMessage, products);
      }
    } else {
      extraction = this.extractWithLocalParser(trimmedMessage, products);
    }

    // 3. Strict Safety Validation & Database Reconciliation
    const validatedItems: ValidatedAiOrderItem[] = [];
    const unrecognized: string[] = [...(extraction.unrecognizedItems || [])];

    let totalEstimated = 0;
    let totalUnits = 0;
    let hasStockWarnings = false;
    let hasLowConfidence = false;

    for (const item of extraction.items) {
      // Find matching product in DB
      const matchedProduct = products.find(
        (p) => p.skuCode.toUpperCase() === item.sku.toUpperCase()
      );

      if (!matchedProduct) {
        // AI Safety Rule: AI must NEVER invent a SKU
        unrecognized.push(`${item.rawText} (Unknown SKU: ${item.sku})`);
        continue;
      }

      const stock = matchedProduct.inventory?.stockQuantity ?? 0;
      const requestedQty = Math.max(1, item.quantity);
      let stockWarning: string | null = null;
      let isAvailable = true;

      if (stock === 0) {
        stockWarning = `Out of stock in Jabalpur warehouse`;
        isAvailable = false;
        hasStockWarnings = true;
      } else if (requestedQty > stock) {
        stockWarning = `Only ${stock} ${matchedProduct.unit}(s) available (requested ${requestedQty})`;
        hasStockWarnings = true;
      }

      // Backend Pricing: AI must NEVER invent a price
      const pricing = PricingService.calculatePrice(
        matchedProduct.basePrice,
        matchedProduct.mrp,
        matchedProduct.gstRate,
        retailerTier
      );

      const confirmedQty = isAvailable ? (requestedQty > stock ? stock : requestedQty) : 0;
      const itemSubtotal = pricing.dealerPrice * requestedQty;
      const gstAmount = Math.round(((itemSubtotal * matchedProduct.gstRate) / 100) * 100) / 100;
      const itemTotal = Math.round((itemSubtotal + gstAmount) * 100) / 100;

      totalEstimated += itemTotal;
      totalUnits += requestedQty;

      const confidence = Math.min(1, Math.max(0, item.confidence));
      let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
      if (confidence < 0.7) {
        confidenceLevel = 'LOW';
        hasLowConfidence = true;
      } else if (confidence < 0.9) {
        confidenceLevel = 'MEDIUM';
      }

      // Collect potential alternative products in same category or brand
      const alternatives = products
        .filter(
          (p) =>
            p.id !== matchedProduct.id &&
            (p.category === matchedProduct.category || p.brand === matchedProduct.brand)
        )
        .slice(0, 3)
        .map((alt) => ({
          sku: alt.skuCode,
          productName: alt.name,
          brand: alt.brand,
          rate: PricingService.calculatePrice(alt.basePrice, alt.mrp, alt.gstRate, retailerTier).dealerPrice,
          stock: alt.inventory?.stockQuantity ?? 0,
          confidence: 0.75,
        }));

      validatedItems.push({
        rawText: item.rawText || matchedProduct.name,
        sku: matchedProduct.skuCode,
        productName: matchedProduct.name,
        brand: matchedProduct.brand,
        category: matchedProduct.category,
        packSize: matchedProduct.packSize,
        requestedQuantity: requestedQty,
        confirmedQuantity: confirmedQty,
        unit: matchedProduct.unit,
        unitPrice: pricing.dealerPrice,
        mrp: pricing.mrp,
        gstRate: matchedProduct.gstRate,
        itemTotal,
        stockAvailable: stock,
        isAvailable: stock > 0,
        stockWarning,
        confidence,
        confidenceLevel,
        reasoning: item.reasoning,
        alternatives,
      });
    }

    return {
      originalMessage: trimmedMessage,
      parsedAt: new Date().toISOString(),
      languageDetected: extraction.languageDetected || 'Hindi / Hinglish / English',
      items: validatedItems,
      unrecognizedItems: unrecognized,
      totalEstimatedAmount: Math.round(totalEstimated * 100) / 100,
      totalUnitsCount: totalUnits,
      hasStockWarnings,
      hasLowConfidenceItems: hasLowConfidence,
    };
  }

  /**
   * Gemini 2.5 Flash structured LLM extraction
   */
  private static async extractWithGemini(
    message: string,
    products: any[],
    apiKey: string
  ): Promise<AiOrderExtraction> {
    const ai = new GoogleGenAI({ apiKey });

    const catalogueSummary = products
      .map(
        (p) =>
          `SKU: "${p.skuCode}" | Name: "${p.name}" | Brand: "${p.brand}" | Unit: "${p.unit}" | Pack: "${p.packSize}"`
      )
      .join('\n');

    const prompt = `
You are an expert FMCG wholesale ordering AI for a distributor in Jabalpur, Madhya Pradesh, India.
Kirana shopkeepers send informal text orders in Hindi, Hinglish, or English via WhatsApp.

Analyze the shopkeeper's order message:
"${message}"

Against this authorized product catalogue:
${catalogueSummary}

FMCG Ordering Terminology Guide:
- "peti", "box", "case", "carton" = Wholesale Case / Box packaging unit.
- "chhota biscuit", "glucose" = Parle-G Glucose Biscuit (PARLE-G-80G).
- "good day", "butter biscuit" = Britannia Good Day (BRIT-GOODDAY-100G).
- "maggi", "noodle", "2 minute" = Nestlé Maggi (MAGGI-NOODLE-70G).
- "chai patti", "tea" = Tea leaf.
- "washing powder", "surf", "detergent" = Surf Excel (SURF-EXCEL-500G).
- "tata namak", "salt" = Tata Salt (TATA-SALT-1KG).
- "tel", "oil", "fortune", "soya" = Fortune Refined Soyabean Oil (FORTUNE-SOYA-1L).
- "sabun", "lifebuoy" = Lifebuoy Total Soap (LIFEBUOY-SOAP-100G).
- "handwash", "dettol" = Dettol Handwash (DETTOL-HW-200ML).
- "paste", "colgate", "dant manjan" = Colgate Dental Cream (COLGATE-MAX-150G).
- "bhujia", "haldiram" = Haldiram Plain Bhujia (HALDIRAM-BHUJIA-400G).
- Numbers in Hindi: ek=1, do=2, teen=3, char=4, paanch=5, chhe=6, saat=7, aath=8, nau=9, das=10, barah=12, pandrah=15, bees=20, pachees=25, pachaas=50, sau=100.

CRITICAL RULES:
1. ONLY map to the exact SKUs in the catalogue above. NEVER invent a SKU.
2. If an item cannot be matched, put its text in unrecognizedItems.
3. Set confidence score between 0.0 and 1.0.
4. Output valid JSON adhering to this schema:
{
  "items": [
    {
      "rawText": "original phrase snippet",
      "sku": "EXACT_SKU_CODE",
      "productName": "Exact Name",
      "quantity": 5,
      "unit": "BOX",
      "confidence": 0.95,
      "reasoning": "matched '5 peti biscuit chhota' to Parle-G",
      "alternatives": []
    }
  ],
  "unrecognizedItems": [],
  "languageDetected": "Hindi/Hinglish",
  "summary": "Extracted order items"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsedJson = JSON.parse(text);

    // Validate using Zod
    return AiOrderExtractionSchema.parse(parsedJson);
  }

  /**
   * Deterministic Jabalpur Kirana NLP Parser (Fallback / Offline support)
   */
  private static extractWithLocalParser(message: string, products: any[]): AiOrderExtraction {
    const rawTokens = message
      .split(/[,;\n\r+]+|(?:\band\b)|(?:\baur\b)/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const items: any[] = [];
    const unrecognizedItems: string[] = [];

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
      gyarah: 11,
      barah: 12,
      terah: 13,
      chaudah: 14,
      pandrah: 15,
      solah: 16,
      satrah: 17,
      atharah: 18,
      unnees: 19,
      bees: 20,
      pachees: 25,
      pachaas: 50,
      sau: 100,
    };

    // Keyword match definitions for FMCG catalogue
    const rules = [
      {
        sku: 'PARLE-G-80G',
        patterns: [/parle[-\s]?g/i, /glucose/i, /chhot[ae]\s*biscuit/i, /biscuit\s*chhot[ae]/i],
      },
      {
        sku: 'BRIT-GOODDAY-100G',
        patterns: [/good[-\s]?day/i, /butter\s*biscuit/i, /britannia/i],
      },
      {
        sku: 'MAGGI-NOODLE-70G',
        patterns: [/maggi/i, /maggie/i, /noodle/i, /2[-\s]?minute/i],
      },
      {
        sku: 'SURF-EXCEL-500G',
        patterns: [/surf[-\s]?excel/i, /surf/i, /washing\s*powder/i, /detergent/i],
      },
      {
        sku: 'TATA-SALT-1KG',
        patterns: [/tata\s*salt/i, /namak/i, /tata\s*namak/i, /salt/i],
      },
      {
        sku: 'FORTUNE-SOYA-1L',
        patterns: [/fortune/i, /soya\s*oil/i, /tel/i, /refined\s*oil/i, /soyabean/i],
      },
      {
        sku: 'LIFEBUOY-SOAP-100G',
        patterns: [/lifebuoy/i, /lifeboy/i, /sabun/i, /soap/i],
      },
      {
        sku: 'DETTOL-HW-200ML',
        patterns: [/dettol/i, /handwash/i, /liquid\s*soap/i],
      },
      {
        sku: 'COLGATE-MAX-150G',
        patterns: [/colgate/i, /paste/i, /toothpaste/i, /dant\s*manjan/i],
      },
      {
        sku: 'HALDIRAM-BHUJIA-400G',
        patterns: [/bhujia/i, /haldiram/i, /namkeen/i, /sev/i],
      },
    ];

    for (const token of rawTokens) {
      // Extract quantity
      let quantity = 1;
      const numMatch = token.match(/\b(\d+)\b/);
      if (numMatch) {
        quantity = parseInt(numMatch[1], 10);
      } else {
        // Look for Hindi word numbers
        const words = token.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (hindiNumbers[w]) {
            quantity = hindiNumbers[w];
            break;
          }
        }
      }

      // Check unit
      let unit = 'BOX';
      if (/case/i.test(token)) unit = 'CASE';
      if (/peti/i.test(token) || /box/i.test(token) || /carton/i.test(token)) unit = 'BOX';
      if (/pouch/i.test(token) || /packet/i.test(token)) unit = 'PACKET';

      // Match against SKU patterns
      let matchedSku: string | null = null;
      let confidence = 0.95;

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
          items.push({
            rawText: token,
            sku: prod.skuCode,
            productName: prod.name,
            quantity,
            unit: prod.unit || unit,
            confidence,
            reasoning: `Matched phrase "${token}" to ${prod.name} (${prod.skuCode})`,
            alternatives: [],
          });
          continue;
        }
      }

      // If token is just a general greeting or blank, ignore; otherwise add to unrecognized
      if (!/bhaiya|namaste|order|urgent|morning|delivery|bhejo/i.test(token) || token.length > 10) {
        unrecognizedItems.push(token);
      }
    }

    return {
      items,
      unrecognizedItems,
      languageDetected: 'Hindi / Hinglish (Kirana Dialect)',
      summary: `Parsed ${items.length} items using local FMCG Natural Language Engine`,
    };
  }
}
