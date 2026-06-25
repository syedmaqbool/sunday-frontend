import type { AdminMarketingLeadsParams } from '@/types/admin/analytics';
import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  getAdminAnalytics,
  listAdminMarketingLeads,
} from '@/services/adminAnalytics.service';

export const adminAnalyticsQueryKey = {
  all: () => ['admin-analytics'] as const,
  marketingLeads: (parameters: AdminMarketingLeadsParams = {}) =>
    [...adminAnalyticsQueryKey.all(), 'marketing-leads', parameters] as const,
  overview: () => [...adminAnalyticsQueryKey.all(), 'overview'] as const,
};

export function getAdminAnalyticsQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getAdminAnalytics();
      return response.data;
    },
    queryKey: adminAnalyticsQueryKey.overview(),
    retry: false,
  });
}

export function useAdminAnalytics() {
  return useQuery(getAdminAnalyticsQueryOptions());
}

export function getAdminMarketingLeadsQueryOptions(parameters: AdminMarketingLeadsParams = {}) {
  return queryOptions({
    queryFn: async () => {
      return listAdminMarketingLeads(parameters);
    },
    queryKey: adminAnalyticsQueryKey.marketingLeads(parameters),
    retry: false,
  });
}

export function useAdminMarketingLeads(parameters: AdminMarketingLeadsParams = {}) {
  return useQuery(getAdminMarketingLeadsQueryOptions(parameters));
}
