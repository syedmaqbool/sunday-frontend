import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  CreateAdminDiscountCodeData,
  GetAdminDiscountCodesResponses,
  UpdateAdminDiscountCodeData,
} from '@/types/generated-api';

export type DiscountCode = ApiResponseItem<GetAdminDiscountCodesResponses>;
export type CreateDiscountCodePayload = ApiRequestBody<CreateAdminDiscountCodeData>;
export type UpdateDiscountCodePayload = ApiRequestBody<UpdateAdminDiscountCodeData>;
