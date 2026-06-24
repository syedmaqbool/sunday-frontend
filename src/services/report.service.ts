import { authInstance } from "@/services/ky.instance";
import type {
  AdminReport,
  ReportStatus,
  ResolveReportPayload,
} from "@/types/admin/report";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listAdminReports(
  params: { status?: ReportStatus; page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/admin/reports", {
      searchParams: {
        status: params.status,
        page: params.page ?? 1,
        size: params.size ?? 100,
      },
    })
    .json<PaginatedResponse<AdminReport>>();
}

export function resolveReport(reportId: string, payload: ResolveReportPayload) {
  return authInstance
    .patch(`/api/v1/admin/reports/${reportId}/resolve`, { json: payload })
    .json<Response<AdminReport>>();
}
