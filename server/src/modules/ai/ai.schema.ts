import { z } from 'zod';

export const RawAiOrderItemSchema = z.object({
  rawText: z.string(),
  sku: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unit: z.string().default('BOX'),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  alternatives: z
    .array(
      z.object({
        sku: z.string(),
        productName: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .default([]),
});

export const AiOrderExtractionSchema = z.object({
  items: z.array(RawAiOrderItemSchema),
  unrecognizedItems: z.array(z.string()).default([]),
  languageDetected: z.string().default('Hindi/Hinglish'),
  summary: z.string().optional(),
});

export type RawAiOrderItem = z.infer<typeof RawAiOrderItemSchema>;
export type AiOrderExtraction = z.infer<typeof AiOrderExtractionSchema>;

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
  alternatives: Array<{
    sku: string;
    productName: string;
    brand: string;
    rate: number;
    stock: number;
    confidence: number;
  }>;
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
