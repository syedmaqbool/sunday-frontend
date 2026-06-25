import type { ReportStatus } from '@/types/admin/report';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { listAdminReports, resolveReport } from '@/services/report.service';

export const adminReportsQueryKey = {
  all: () => ['admin-reports'] as const,
  list: (status?: 'all' | ReportStatus) =>
    [...adminReportsQueryKey.all(), 'list', status] as const,
};

export function getAdminReportsOptions(status?: 'all' | ReportStatus) {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminReports({
        size: 100,
        status: status && status !== 'all' ? status : undefined,
      });
      return response.data;
    },
    queryKey: adminReportsQueryKey.list(status),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      adminNotes,
      status,
    }: {
      reportId: string;
      adminNotes?: string;
      status: 'DISMISSED' | 'RESOLVED';
    }) => resolveReport(reportId, { adminNotes, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReportsQueryKey.all() });
    },
  });
}
