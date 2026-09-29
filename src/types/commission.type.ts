import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  CreateAdminCommissionTierData,
  GetCommissionTiersResponses,
  UpdateAdminCommissionTierData,
} from '@/types/generated-api';

export type CommissionTier = ApiResponseItem<GetCommissionTiersResponses>;
export type CommissionTierPayload = ApiRequestBody<CreateAdminCommissionTierData> | ApiRequestBody<UpdateAdminCommissionTierData>;
