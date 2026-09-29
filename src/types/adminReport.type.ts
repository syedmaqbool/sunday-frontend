import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateReportData,
  GetAdminReportsData,
  GetAdminReportsResponses,
  ResolveAdminReportData,
} from '@/types/generated-api';

export type AdminReport = ApiResponseItem<GetAdminReportsResponses>;
export type ReportStatus = AdminReport['status'];
export type ResolveReportPayload = ApiRequestBody<ResolveAdminReportData>;
export type CreateReportPayload = ApiRequestBody<CreateReportData>;
export type AdminReportParameters = Partial<ApiRequestQuery<GetAdminReportsData>>;
