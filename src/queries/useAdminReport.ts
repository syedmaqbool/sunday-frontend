import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportService, type ReportStatus } from "@/services/report.service";

const REPORTS_KEY = ["admin-reports"];

export const useAdminReports = (status?: ReportStatus | "all") =>
  useQuery({
    queryKey: [...REPORTS_KEY, status],
    queryFn: async () => {
      const res = await reportService.list({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      });
      return res.data;
    },
  });

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
    }) => reportService.resolve(reportId, { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
};
