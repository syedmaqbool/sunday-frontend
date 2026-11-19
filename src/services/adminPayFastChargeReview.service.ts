import type {
  AdminPayFastChargeReviewListParameters,
  AdminPayFastChargeReviewResolutionPayload,
} from '@/types/adminPayFastChargeReview.type';
import type {
  GetAdminPayFastChargeReviewResponses,
  GetAdminPayFastChargeReviewsResponses,
  ResolveAdminPayFastChargeReviewResponses,
} from '@/types/generated-api';
import { authInstance } from '@/services/ky.instance';

export function listAdminPayFastChargeReviews(parameters: AdminPayFastChargeReviewListParameters) {
  return authInstance
    .get('/api/v1/admin/payfast-charge-reviews', { searchParams: parameters })
    .json<GetAdminPayFastChargeReviewsResponses['200']>();
}

export function getAdminPayFastChargeReview(paymentTransactionId: string) {
  return authInstance
    .get(`/api/v1/admin/payfast-charge-reviews/${paymentTransactionId}`)
    .json<GetAdminPayFastChargeReviewResponses['200']>();
}

export function resolveAdminPayFastChargeReview(
  paymentTransactionId: string,
  payload: AdminPayFastChargeReviewResolutionPayload,
) {
  return authInstance
    .post(`/api/v1/admin/payfast-charge-reviews/${paymentTransactionId}/resolution`, {
      json: payload,
    })
    .json<ResolveAdminPayFastChargeReviewResponses['200']>();
}
