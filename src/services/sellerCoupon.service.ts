import type { GetAdminSellerCouponsData } from '@/types/generated-api';
import type { PaginatedResponse, Response } from '@/types/response.type';
import type {
  CreateSellerCouponPayload,
  SellerCoupon,
  UpdateSellerCouponPayload,
} from '@/types/sellerCoupon.type';
import { authInstance } from '@/services/ky.instance';

export function listSellerCoupons(query: GetAdminSellerCouponsData['query']) {
  return authInstance
    .get('/api/v1/admin/seller-coupons', {
      searchParams: query,
    })
    .json<PaginatedResponse<SellerCoupon>>();
}

export function createSellerCoupon(payload: CreateSellerCouponPayload) {
  return authInstance
    .post('/api/v1/admin/seller-coupons', { json: payload })
    .json<Response<SellerCoupon>>();
}

export function updateSellerCoupon(id: string, payload: UpdateSellerCouponPayload) {
  return authInstance
    .patch(`/api/v1/admin/seller-coupons/${id}`, { json: payload })
    .json<Response<SellerCoupon>>();
}

export function deleteSellerCoupon(id: string) {
  return authInstance.delete(`/api/v1/admin/seller-coupons/${id}`).json<Response>();
}
