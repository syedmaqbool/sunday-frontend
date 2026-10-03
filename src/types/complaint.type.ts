import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateComplaintData,
  GetAdminComplaintsData,
  GetAdminComplaintsResponses,
  GetMyComplaintsResponses,
  ProvideComplaintReturnAddressData,
  UpdateAdminComplaintStatusData,
  UploadComplaintReturnProofData,
} from '@/types/generated-api';

export type Complaint = ApiResponseItem<GetMyComplaintsResponses>;
export type AdminComplaint = ApiResponseItem<GetAdminComplaintsResponses>;
export type ComplaintStatus = Complaint['status'];
export type AdminComplaintStatus = ApiRequestBody<UpdateAdminComplaintStatusData>['status'];
export type UpdateComplaintStatusPayload = ApiRequestBody<UpdateAdminComplaintStatusData>;
export type CreateComplaintPayload = ApiRequestBody<CreateComplaintData>;
export type ProvideReturnAddressPayload = ApiRequestBody<ProvideComplaintReturnAddressData>;
export type SubmitReturnProofPayload = ApiRequestBody<UploadComplaintReturnProofData>;
export type AdminComplaintsParameters = Partial<ApiRequestQuery<GetAdminComplaintsData>>;
