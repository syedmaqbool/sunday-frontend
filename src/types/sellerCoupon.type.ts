import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  CreateAdminSellerCouponData,
  GetAdminSellerCouponRedemptionsResponses,
  GetAdminSellerCouponsResponses,
  UpdateAdminSellerCouponData,
} from '@/types/generated-api';

export type SellerCoupon = ApiResponseItem<GetAdminSellerCouponsResponses>;
export type SellerCouponRedemption = ApiResponseItem<GetAdminSellerCouponRedemptionsResponses>;
export type CreateSellerCouponPayload = ApiRequestBody<CreateAdminSellerCouponData>;
export type UpdateSellerCouponPayload = ApiRequestBody<UpdateAdminSellerCouponData>;
