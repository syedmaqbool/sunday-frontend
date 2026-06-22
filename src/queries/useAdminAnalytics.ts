import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsService } from "@/services/adminAnalytics.service";

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: ["admin-analytics"],

    queryFn: async () => {
      const response = await adminAnalyticsService.get();

      return response.data;
    },

    retry: false,
  });

export const useAdminMarketingLeads = (
  params: {
    page?: number;
    size?: number;
    search?: string;
    leadStatus?: string;
  }
) =>
  useQuery({
    queryKey: ["admin-marketing-leads", params],

    queryFn: async () => {
      return adminAnalyticsService.marketingLeads(params);
    },

    retry: false,
  });
