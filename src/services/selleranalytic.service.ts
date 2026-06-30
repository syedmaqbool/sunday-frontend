import type { Response } from '@/types/response.type';
import type { SellerAnalytics } from '@/types/sellerAnalytics.type';
import { authInstance } from '@/services/ky.instance';

export function getSellerAnalytics() {
  return authInstance
    .get('/api/v1/me/seller-analytics')
    .json<Response<SellerAnalytics>>();
}
