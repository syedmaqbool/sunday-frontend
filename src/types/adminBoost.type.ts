import type {
  ApproveAdminBoostPaymentData,
  GetAdminBoostPaymentSubmissionsResponse,
  RejectAdminBoostPaymentData,
  RequestAdminBoostPaymentResubmissionData,
} from '@/types/generated-api';

export type AdminBoostPaymentSubmission = GetAdminBoostPaymentSubmissionsResponse['data'][number];

export interface ApproveAdminBoostPaymentVariables {
  submissionId: string;
  payload?: ApproveAdminBoostPaymentData['body'];
}

export interface RejectAdminBoostPaymentVariables {
  submissionId: string;
  payload: RejectAdminBoostPaymentData['body'];
}

export interface RequestAdminBoostPaymentResubmissionVariables {
  submissionId: string;
  payload: RequestAdminBoostPaymentResubmissionData['body'];
}
