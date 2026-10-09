import type { ApiRequestQuery, ApiSuccessResponse } from './api.type';
import type {
  GetAdminFinanceReportSummaryData,
  GetAdminFinanceReportSummaryResponses,
} from '@/types/generated-api';

export type AdminFinanceReportSummaryParams = ApiRequestQuery<GetAdminFinanceReportSummaryData>;
export type AdminFinanceReportSummaryResponse = ApiSuccessResponse<GetAdminFinanceReportSummaryResponses>;
