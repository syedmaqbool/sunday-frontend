import type { AdminMarginReportParams, AdminMarginReportResponse } from '@/types/adminMarginReport.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminMarginReport(parameters: AdminMarginReportParams) {
  return authInstance
    .get('/api/v1/admin/margins', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<AdminMarginReportResponse>();
}
