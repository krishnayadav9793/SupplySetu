import { Response, NextFunction } from 'express';
import { PriceTier } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AiOrderCaptureService } from './ai.service';
import { prisma } from '../../config';

export class AiOrderCaptureController {
  /**
   * Helper to resolve the effective price tier for the request
   */
  private static async resolvePriceTier(req: AuthenticatedRequest): Promise<PriceTier> {
    if (req.body.tier && Object.values(PriceTier).includes(req.body.tier)) {
      return req.body.tier as PriceTier;
    }

    if (req.user?.id) {
      const retailer = await prisma.retailer.findUnique({
        where: { userId: req.user.id },
        select: { priceTier: true },
      });
      if (retailer) return retailer.priceTier;
    }

    return PriceTier.STANDARD;
  }

  /**
   * Get diagnostic status of Gemini AI configuration and active models
   */
  static async getStatus(req: AuthenticatedRequest, res: Response) {
    const status = AiOrderCaptureService.getAiStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  }

  /**
   * Standard text message AI order capture (WhatsApp / SMS)
   */
  static async captureOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          message: 'A text message is required for AI order capture (Hindi/English).',
        });
        return;
      }

      const tier = await AiOrderCaptureController.resolvePriceTier(req);
      const result = await AiOrderCaptureService.processOrderMessage(message, tier);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Multimodal AI order capture (Handwritten paper slip / invoice photo + optional voice notes)
   */
  static async captureMultimodalOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { imageBase64, mimeType, textNotes } = req.body;

      if (!imageBase64 && (!textNotes || !textNotes.trim())) {
        res.status(400).json({
          success: false,
          message: 'Either an image (base64) or transcribed text notes must be provided.',
        });
        return;
      }

      const tier = await AiOrderCaptureController.resolvePriceTier(req);
      const result = await AiOrderCaptureService.processMultimodalOrder(
        { imageBase64, mimeType, textNotes },
        tier
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick demonstration samples
   */
  static async getSamplePrompts(req: AuthenticatedRequest, res: Response) {
    const samples = [
      {
        title: 'Kirana Morning Rush',
        message: 'Bhaiya 10 peti Parle G, 5 case Maggi noodle, 2 peti Tata namak jaldi bhej dena kal subah',
        description: 'Standard fast-moving grocery staples',
      },
      {
        title: 'Mixed Hindi Hinglish Order',
        message: '5 peti chhota biscuit, 2 peti washing powder, 3 box refined tel, aur 2 case colgate',
        description: 'Uses colloquial Kirana terms (peti, chhota biscuit, washing powder, tel)',
      },
      {
        title: 'Home Care & Hygiene Top-up',
        message: 'Surf Excel 500g 5 peti, Lifebuoy sabun 3 box, Dettol handwash 2 peti',
        description: 'Laundry and soap volume orders with scheme benefits',
      },
    ];

    res.status(200).json({
      success: true,
      data: samples,
    });
  }
}
