import { queryOptions } from '@tanstack/react-query';
import { getSellerAnalytics } from '@/services/sellerAnalytic.service';

export const sellerAnalyticsQueryKey = {
  all: () => ['seller-analytics'] as const,
};

export function getSellerAnalyticsOptions() {
  return queryOptions({
    queryFn: () => getSellerAnalytics(),
    queryKey: sellerAnalyticsQueryKey.all(),
  });
}

