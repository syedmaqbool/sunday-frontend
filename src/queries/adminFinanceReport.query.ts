import type { AdminFinanceReportSummaryParams } from '@/types/adminFinanceReport.type';
import { queryOptions } from '@tanstack/react-query';
import { getAdminFinanceReportSummary } from '@/services/adminFinanceReport.service';

export const adminFinanceReportQueryKey = {
  all: () => ['admin-finance-report'] as const,
  summary: (parameters: AdminFinanceReportSummaryParams) =>
    [...adminFinanceReportQueryKey.all(), 'summary', parameters] as const,
};

export function getAdminFinanceReportSummaryQueryOptions(
  parameters: AdminFinanceReportSummaryParams,
) {
  return queryOptions({
    queryFn: () => getAdminFinanceReportSummary(parameters),
    queryKey: adminFinanceReportQueryKey.summary(parameters),
    retry: false,
  });
}
