import type {
  AdminSettings,
  AdminSettingsUpdatePayload,
  UpdateBoostPackagesPayload,
} from '@/types/adminSettings.type';
import type { AdminBoostListParameters, ListingBoost } from '@/types/boost.type';
import type {
  ApproveAdminBoostPaymentData,
  ApproveAdminBoostPaymentResponse,
  CompleteAdminBoostRefundResponse,
  GetAdminBoostPaymentSubmissionsData,
  GetAdminBoostPaymentSubmissionsResponse,
  RejectAdminBoostPaymentData,
  RejectAdminBoostPaymentResponse,
  RequestAdminBoostPaymentResubmissionData,
  RequestAdminBoostPaymentResubmissionResponse,
} from '@/types/generated-api';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export async function getBoostPackages() {
  return authInstance.get('/api/v1/admin/settings').json<Response<AdminSettings>>();
}

export function updateBoostPackages(packages: UpdateBoostPackagesPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', {
      json: { boostPackages: packages } satisfies AdminSettingsUpdatePayload,
    })
    .json<Response<AdminSettings>>();
}

export function listBoosts(parameters: AdminBoostListParameters = {}) {
  return authInstance
    .get('/api/v1/admin/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}

export function listAdminBoostPaymentSubmissions(
  parameters: GetAdminBoostPaymentSubmissionsData['query'],
) {
  return authInstance
    .get('/api/v1/admin/boost-payment-submissions', { searchParams: parameters })
    .json<GetAdminBoostPaymentSubmissionsResponse>();
}

export function getAdminBoostPaymentProofFile(fileId: string) {
  return authInstance.get(`/api/v1/payment-proof-files/${fileId}`).blob();
}

export function approveAdminBoostPayment(
  submissionId: string,
  payload?: ApproveAdminBoostPaymentData['body'],
) {
  return authInstance
    .post(`/api/v1/admin/boost-payment-submissions/${submissionId}/approve`, {
      json: payload ?? {},
    })
    .json<ApproveAdminBoostPaymentResponse>();
}

export function rejectAdminBoostPayment(
  submissionId: string,
  payload: RejectAdminBoostPaymentData['body'],
) {
  return authInstance
    .post(`/api/v1/admin/boost-payment-submissions/${submissionId}/reject`, { json: payload })
    .json<RejectAdminBoostPaymentResponse>();
}

export function requestAdminBoostPaymentResubmission(
  submissionId: string,
  payload: RequestAdminBoostPaymentResubmissionData['body'],
) {
  return authInstance
    .post(`/api/v1/admin/boost-payment-submissions/${submissionId}/request-resubmission`, {
      json: payload,
    })
    .json<RequestAdminBoostPaymentResubmissionResponse>();
}

export function completeAdminBoostRefund(purchaseId: string) {
  return authInstance
    .post(`/api/v1/admin/boost-purchases/${purchaseId}/refund-completion`)
    .json<CompleteAdminBoostRefundResponse>();
}
