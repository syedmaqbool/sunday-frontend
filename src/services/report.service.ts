import type {
  AdminReport,
  AdminReportParameters,
  CreateReportPayload,
  ResolveReportPayload,
} from '@/types/adminReport.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function createReport(payload: CreateReportPayload) {
  return authInstance
    .post('/api/v1/reports', { json: payload })
    .json<Response<AdminReport>>();
}

export function listAdminReports(
  parameters: AdminReportParameters = {},
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
