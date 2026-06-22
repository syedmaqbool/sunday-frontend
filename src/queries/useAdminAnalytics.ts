import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsService } from "@/services/adminAnalytics.service";

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await adminAnalyticsService.get();
      return res.data;
    },
  });

export const useAdminMarketingLeads = (params: { page?: number; size?: number; search?: string; leadStatus?: string }) =>
  useQuery({
    queryKey: ["admin-marketing-leads", params],
    queryFn: async () => {
      const res = await adminAnalyticsService.marketingLeads(params);
      return res;
    },
  });