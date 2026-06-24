import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getAdminAnalytics,
  listAdminMarketingLeads,
} from "@/services/adminAnalytics.service";
import type { AdminMarketingLeadsParams } from "@/types/admin/analytics";

export const adminAnalyticsQueryKey = {
  all: () => ["admin-analytics"] as const,
  overview: () => [...adminAnalyticsQueryKey.all(), "overview"] as const,
  marketingLeads: (params: AdminMarketingLeadsParams = {}) =>
    [...adminAnalyticsQueryKey.all(), "marketing-leads", params] as const,
};

export const getAdminAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: adminAnalyticsQueryKey.overview(),
    queryFn: async () => {
      const response = await getAdminAnalytics();
      return response.data;
    },
    retry: false,
  });

export const useAdminAnalytics = () =>
  useQuery(getAdminAnalyticsQueryOptions());

export const getAdminMarketingLeadsQueryOptions = (
  params: AdminMarketingLeadsParams = {},
) =>
  queryOptions({
    queryKey: adminAnalyticsQueryKey.marketingLeads(params),
    queryFn: async () => {
      return listAdminMarketingLeads(params);
    },
    retry: false,
  });

export const useAdminMarketingLeads = (
  params: AdminMarketingLeadsParams = {},
) => useQuery(getAdminMarketingLeadsQueryOptions(params));
