import type {
  AdminReport,
  ReportStatus,
  ResolveReportPayload,
} from '@/types/admin/report';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

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
