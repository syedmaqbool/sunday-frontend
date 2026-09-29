import type { ApiResponseData } from './api.type';
import type { GetSellerAnalyticsResponses } from '@/types/generated-api';

export type SellerAnalytics = ApiResponseData<GetSellerAnalyticsResponses>;
export type OfferStatusCount = SellerAnalytics['offerStatusCounts'][number];
export type OfferStatus = OfferStatusCount['status'];
export type CategoryDistribution = SellerAnalytics['listingCategoryDistribution'][number];
export type MonthlyValue = SellerAnalytics['monthlyAcceptedOfferValue'][number];
