import type { AnalyticsDateRange } from '@/types/analyticsDateRange.type';
import { queryOptions } from '@tanstack/react-query';
import { getSellerAnalytics } from '@/services/sellerAnalytic.service';

export const sellerAnalyticsQueryKey = {
  all: () => ['seller-analytics'] as const,
  overview: (parameters: AnalyticsDateRange = {}) => [...sellerAnalyticsQueryKey.all(), 'overview', parameters] as const,
};

export function getSellerAnalyticsOptions(parameters: AnalyticsDateRange = {}) {
  return queryOptions({
    queryFn: () => getSellerAnalytics(parameters),
    queryKey: sellerAnalyticsQueryKey.overview(parameters),
  });
}
