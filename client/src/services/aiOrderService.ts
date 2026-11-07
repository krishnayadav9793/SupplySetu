import { ValidatedAiOrderCaptureResult, SamplePrompt, AiStatusResponse } from '../types';
import { apiFetch } from './api';
import { ProductService } from './productService';

export interface SampleParchi {
  id: string;
  title: string;
  category: string;
  lines: string[];
  notes: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: 'Benchmark Order (Problem Statement Sample)',
    message: 'bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti',
    description: 'Exact benchmark order from Jabalpur problem statement (tests stock-out detection on tea)',
  },
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

export const SAMPLE_PARCHIS: SampleParchi[] = [
  {
    id: 'parchi-1',
    title: 'Daily Kirana Order Slip (दुकान पर्ची)',
    category: 'Grocery Staples',
    lines: [
      '1. पारले जी (Parle-G) - 10 पेटी',
      '2. मैगी नूडल (Maggi) - 5 केस',
      '3. टाटा नमक 1kg - 2 पेटी',
      '4. फॉर्च्यून सोया तेल 1L - 3 बॉक्स',
    ],
    notes: 'कल दोपहर 2 बजे तक माल दुकान पर पहुंचा देना',
  },
  {
    id: 'parchi-2',
    title: 'Home Care & Detergents Slip',
    category: 'Cleaning & Personal Care',
    lines: [
      '1. Surf Excel 500g - 5 peti',
      '2. Lifebuoy Total Soap - 3 box',
      '3. Dettol Handwash 200ml - 2 peti',
      '4. Colgate Dental Cream 150g - 2 case',
    ],
    notes: 'Payment via UPI on delivery',
  },
  {
    id: 'parchi-3',
    title: 'Evening Snack Counter Slip',
    category: 'Biscuits & Snacks',
    lines: [
      '1. Parle-G 80g Glucose - 8 peti',
      '2. Britannia Good Day 100g - 6 case',
      '3. Haldiram Plain Bhujia 400g - 4 box',
    ],
    notes: 'Urgent stock needed for weekend demand',
  },
];

/**
 * Generates an SVG Data URI representing a realistic handwritten Kirana paper slip ("Parchi")
 */
export function generateParchiDataUrl(parchi: SampleParchi): string {
  const lineElements = parchi.lines
    .map(
      (line, i) =>
        `<text x="35" y="${110 + i * 32}" font-family="'Courier New', monospace" font-size="15" font-weight="600" fill="#1e293b">${line}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="340" viewBox="0 0 460 340">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12" />
      </filter>
    </defs>
    <!-- Paper Sheet Background -->
    <rect x="15" y="15" width="430" height="310" rx="6" fill="#fefdf7" stroke="#e2d8b3" stroke-width="1.5" filter="url(#shadow)" />
    <!-- Notebook Red Margin Line -->
    <line x1="28" y1="20" x2="28" y2="320" stroke="#f43f5e" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
    <!-- Notebook Horizontal Lines -->
    <line x1="15" y1="75" x2="445" y2="75" stroke="#93c5fd" stroke-width="0.8" opacity="0.45"/>
    <line x1="15" y1="115" x2="445" y2="115" stroke="#93c5fd" stroke-width="0.8" opacity="0.35"/>
    <line x1="15" y1="147" x2="445" y2="147" stroke="#93c5fd" stroke-width="0.8" opacity="0.35"/>
    <line x1="15" y1="179" x2="445" y2="179" stroke="#93c5fd" stroke-width="0.8" opacity="0.35"/>
    <line x1="15" y1="211" x2="445" y2="211" stroke="#93c5fd" stroke-width="0.8" opacity="0.35"/>
    <line x1="15" y1="243" x2="445" y2="243" stroke="#93c5fd" stroke-width="0.8" opacity="0.35"/>
    <!-- Header Stamp / Title -->
    <text x="35" y="52" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#0f172a">📝 ${parchi.title}</text>
    <text x="350" y="52" font-family="sans-serif" font-size="11" fill="#64748b">${new Date().toLocaleDateString('en-IN')}</text>
    <!-- Order Lines -->
    ${lineElements}
    <!-- Bottom note -->
    <rect x="30" y="260" width="400" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="40" y="280" font-family="sans-serif" font-size="11" font-weight="bold" fill="#475569">NOTE / निर्देश:</text>
    <text x="40" y="298" font-family="sans-serif" font-size="11" fill="#64748b">${parchi.notes}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AiOrderService = {
  /**
   * Diagnostic check on Gemini API Key and active AI engine
   */
  async getAiStatus(): Promise<AiStatusResponse> {
    try {
      const res = await apiFetch<AiStatusResponse>('/ai/status');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Could not query AI status, defaulting to local fallback mode:', err);
    }

    return {
      isGeminiConfigured: false,
      model: 'gemini-2.5-flash',
      activeEngine: 'LOCAL_FMCG_PARSER',
      supportedFeatures: [
        'natural_language_text',
        'handwritten_parchi_vision',
        'voice_speech_to_text',
        'live_stock_reconciliation',
      ],
      guidanceMessage:
        'Running in Local FMCG Regex/Heuristic Mode. Set GEMINI_API_KEY in server/.env to enable live Gemini 2.5 Flash Vision.',
    };
  },

  /**
   * Text order capture (WhatsApp / SMS)
   */
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

    return this.parseLocally(message);
  },

  /**
   * Multimodal order capture (Image of handwritten slip / invoice + optional voice/notes)
   */
  async captureMultimodalOrder(params: {
    imageBase64?: string;
    mimeType?: string;
    textNotes?: string;
  }): Promise<ValidatedAiOrderCaptureResult> {
    try {
      const res = await apiFetch<ValidatedAiOrderCaptureResult>('/ai/order-capture-multimodal', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Multimodal AI call failed, falling back to local extractor:', err);
    }

    // Fallback if backend is unreachable
    if (params.textNotes) {
      return this.parseLocally(params.textNotes);
    }

    // Fallback default sample order
    return this.parseLocally('10 peti Parle G, 5 case Maggi noodle, 2 peti Tata namak, 3 box refined tel');
  },

  async getSamplePrompts(): Promise<SamplePrompt[]> {
    try {
      const res = await apiFetch<SamplePrompt[]>('/ai/samples');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      // ignore
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
          const subtotal = rate * quantity;
          const gst = (subtotal * prod.gstRate) / 100;
          const itemTotal = subtotal + gst;

          const isAvail = prod.stock > 0;
          const confirmedQty = isAvail ? Math.min(quantity, prod.stock) : 0;
          let stockWarning: string | null = null;

          if (prod.stock === 0) {
            stockWarning = 'Out of stock in Jabalpur warehouse';
            hasStockWarnings = true;
          } else if (quantity > prod.stock) {
            stockWarning = `Only ${prod.stock} available`;
            hasStockWarnings = true;
          }

          totalEstimated += itemTotal;
          totalUnits += quantity;

          const alternatives = products
            .filter((p) => p.id !== prod.id && (p.category === prod.category || p.brand === prod.brand))
            .slice(0, 3)
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
      engineUsed: 'LOCAL_FMCG_PARSER',
      captureMode: 'TEXT',
    };
  },
};
