import { Router } from 'express';
import { optionalAuthenticate } from '../../middleware/auth';
import { AnalyticsController } from './analytics.controller';

const router = Router();

// Executive Overview
router.get('/overview', optionalAuthenticate, AnalyticsController.getOverview);

// 14-Day Inactive Kirana Churn Radar
router.get('/churn-radar', optionalAuthenticate, AnalyticsController.getChurnRadar);

// Credit Khata & Receivables Financial Risk
router.get('/financial-risk', optionalAuthenticate, AnalyticsController.getFinancialRisk);

// Salesman Beat & Field Quota Performance
router.get(
  '/salesman-performance',
  optionalAuthenticate,
  AnalyticsController.getSalesmanPerformance
);

export default router;
