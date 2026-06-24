import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { listAdminReports, resolveReport } from "@/services/report.service";
import type { ReportStatus } from "@/types/admin/report";

export const adminReportsQueryKey = {
  all: () => ["admin-reports"] as const,
  list: (status?: ReportStatus | "all") =>
    [...adminReportsQueryKey.all(), "list", status] as const,
};

export const getAdminReportsOptions = (status?: ReportStatus | "all") =>
  queryOptions({
    queryKey: adminReportsQueryKey.list(status),
    queryFn: async () => {
      const res = await listAdminReports({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      });
      return res.data;
    },
  });

export const useAdminReports = (status?: ReportStatus | "all") =>
  useQuery(getAdminReportsOptions(status));

export const useResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      status,
      adminNotes,
    }: {
      reportId: string;
      status: "DISMISSED" | "RESOLVED";
      adminNotes?: string;
    }) => resolveReport(reportId, { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReportsQueryKey.all() });
    },
  });
};
