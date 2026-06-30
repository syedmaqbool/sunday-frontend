import type {
  AdminReport,
  ReportStatus,
  ResolveReportPayload,
} from '@/types/adminReport.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export interface CreateReportPayload {
  conversationId?: string;
  listingId?: string;
  messageId?: string;
  reportedUserId?: string;
  details?: string;
  reason: string;
}

export function createReport(payload: CreateReportPayload) {
  return authInstance
    .post('/api/v1/reports', { json: payload })
    .json<Response<AdminReport>>();
}

export function listAdminReports(
  parameters: { page?: number; size?: number; status?: ReportStatus } = {},
) {
  return authInstance
    .get('/api/v1/admin/reports', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
        status: parameters.status,
      },
    })
    .json<PaginatedResponse<AdminReport>>();
}

export function resolveReport(reportId: string, payload: ResolveReportPayload) {
  return authInstance
    .patch(`/api/v1/admin/reports/${reportId}/resolve`, { json: payload })
    .json<Response<AdminReport>>();
}
