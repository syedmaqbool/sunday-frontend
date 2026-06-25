import type {
  CreateDiscountCodePayload,
  DiscountCode,
  UpdateDiscountCodePayload,
} from '@/types/discount-code';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listDiscountCodes() {
  return authInstance
    .get('/api/v1/admin/settings/discount-codes')
    .json<PaginatedResponse<DiscountCode>>();
}

export function createDiscountCode(payload: CreateDiscountCodePayload) {
  return authInstance
    .post('/api/v1/admin/settings/discount-codes', { json: payload })
    .json<Response<DiscountCode>>();
}

export function updateDiscountCode(
  discountCodeId: string,
  payload: UpdateDiscountCodePayload,
) {
  return authInstance
    .patch(`/api/v1/admin/settings/discount-codes/${discountCodeId}`, {
      json: payload,
    })
    .json<Response<DiscountCode>>();
}

export function deleteDiscountCode(discountCodeId: string) {
  return authInstance
    .delete(`/api/v1/admin/settings/discount-codes/${discountCodeId}`)
    .json<Response>();
}
