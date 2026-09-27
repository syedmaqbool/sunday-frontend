import type { AnalyticsDateRange } from '@/types/analyticsDateRange.type';
import type { Response } from '@/types/response.type';
import type { SellerAnalytics } from '@/types/sellerAnalytics.type';
import { authInstance } from '@/services/ky.instance';

export function getSellerAnalytics(parameters: AnalyticsDateRange = {}) {
  return authInstance
    .get('/api/v1/me/seller-analytics', {
      searchParams: parameters as Record<string, string | undefined>,
    })
    .json<Response<SellerAnalytics>>();
}
