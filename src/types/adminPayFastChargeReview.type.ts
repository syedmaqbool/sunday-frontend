import type {
  GetAdminPayFastChargeReviewsData,
  ResolveAdminPayFastChargeReviewData,
} from '@/types/generated-api';
import type { ApiRequestBody, ApiRequestQuery } from './api.type';

export type AdminPayFastChargeReviewListParameters =
  ApiRequestQuery<GetAdminPayFastChargeReviewsData>;
export type AdminPayFastChargeReviewResolutionPayload =
  ApiRequestBody<ResolveAdminPayFastChargeReviewData>;
export type AdminPayFastChargeReviewOutcome = AdminPayFastChargeReviewResolutionPayload['outcome'];

export interface ResolveAdminPayFastChargeReviewVariables {
  chargeRecordId: string;
  payload: AdminPayFastChargeReviewResolutionPayload;
}
