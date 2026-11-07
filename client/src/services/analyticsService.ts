import { apiFetch } from './api';
import {
  ExecutiveAnalyticsData,
  InactiveRetailerRecord,
  FinancialRiskData,
  SalesmanPerformanceRecord,
} from '../types';

export class AnalyticsService {
  /**
   * Fetch executive overview KPIs, GMV trends, brand/category mix and top kiranas
   */
  static async getOverview(): Promise<ExecutiveAnalyticsData> {
    const response = await apiFetch<ExecutiveAnalyticsData>('/analytics/overview');
    return response.data;
  }

  /**
   * Fetch 14-day inactive kirana churn radar
   */
  static async getChurnRadar(threshold: number = 14): Promise<InactiveRetailerRecord[]> {
    const response = await apiFetch<InactiveRetailerRecord[]>(
      `/analytics/churn-radar?threshold=${threshold}`
    );
    return response.data;
  }

  /**
   * Fetch credit risk analysis, aging breakdown, and over-limit kiranas
   */
  static async getFinancialRisk(): Promise<FinancialRiskData> {
    const response = await apiFetch<FinancialRiskData>('/analytics/financial-risk');
    return response.data;
  }

  /**
   * Fetch beat targets and field sales performance
   */
  static async getSalesmanPerformance(salesmanId?: string): Promise<SalesmanPerformanceRecord[]> {
    const url = salesmanId
      ? `/analytics/salesman-performance?salesmanId=${salesmanId}`
      : '/analytics/salesman-performance';
    const response = await apiFetch<SalesmanPerformanceRecord[]>(url);
    return response.data;
  }
}
