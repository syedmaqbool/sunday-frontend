import type { AdminMarginReportParams } from '@/types/adminMarginReport.type';
import { queryOptions } from '@tanstack/react-query';
import { getAdminMarginReport } from '@/services/adminMarginReport.service';

export const adminMarginReportQueryKey = {
  all: () => ['admin-margin-report'] as const,
  list: (parameters: AdminMarginReportParams = {}) =>
    [...adminMarginReportQueryKey.all(), 'list', parameters] as const,
};

export function getAdminMarginReportQueryOptions(
  parameters: AdminMarginReportParams = {},
) {
  return queryOptions({
    queryFn: () => getAdminMarginReport(parameters),
    queryKey: adminMarginReportQueryKey.list(parameters),
    retry: false,
  });
}
