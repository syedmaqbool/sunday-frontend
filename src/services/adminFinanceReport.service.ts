import type {
  AdminFinanceReportSummaryParams,
  AdminFinanceReportSummaryResponse,
} from '@/types/adminFinanceReport.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminFinanceReportSummary(parameters: AdminFinanceReportSummaryParams) {
  return authInstance
    .get('/api/v1/admin/finance-reports/summary', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<AdminFinanceReportSummaryResponse>();
}
