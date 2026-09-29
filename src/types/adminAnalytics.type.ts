import type { ApiRequestQuery, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  ExportAdminMarketingLeadsData,
  GetAdminAnalyticsResponses,
  GetAdminMarketingLeadsData,
  GetAdminMarketingLeadsResponses,
} from '@/types/generated-api';

export type AdminAnalytics = ApiResponseData<GetAdminAnalyticsResponses>;
export type DimKey = keyof AdminAnalytics['breakdowns'];
export type BreakdownRow = AdminAnalytics['breakdowns'][DimKey][number];
export type FunnelRow = AdminAnalytics['funnels'][DimKey][number];
export type AvgOffersRow = AdminAnalytics['averageOffersBeforePurchase'][DimKey][number];
export type PriceVarianceRow = AdminAnalytics['priceVariance'][DimKey][number];

export type AdminMarketingLead = ApiResponseItem<GetAdminMarketingLeadsResponses>;
export type AdminMarketingLeadStatusFilter = '' | AdminMarketingLead['leadStatus'];
export type AdminMarketingLeadsParams = Partial<ApiRequestQuery<GetAdminMarketingLeadsData>>;
export type AdminMarketingLeadsExportParams = Omit<Partial<ApiRequestQuery<ExportAdminMarketingLeadsData>>, 'leadStatus'> & {
  leadStatus?: AdminMarketingLeadStatusFilter;
};
