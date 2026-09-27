import type {
  AdminMarketingLeadsExportParams,
  AdminMarketingLeadsParams,
} from '@/types/adminAnalytics.type';
import type { AnalyticsDateRange } from '@/types/analyticsDateRange.type';
import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  exportAdminMarketingLeads,
  getAdminAnalytics,
  listAdminMarketingLeads,
} from '@/services/adminAnalytics.service';

export const adminAnalyticsQueryKey = {
  all: () => ['admin-analytics'] as const,
  marketingLeads: {
    all: () => [...adminAnalyticsQueryKey.all(), 'marketing-leads'] as const,
    list: (parameters: AdminMarketingLeadsParams = {}) =>
      [...adminAnalyticsQueryKey.marketingLeads.all(), 'list', parameters] as const,
  },
  overview: (parameters: AnalyticsDateRange = {}) => [...adminAnalyticsQueryKey.all(), 'overview', parameters] as const,
};

export function getAdminAnalyticsQueryOptions(parameters: AnalyticsDateRange = {}) {
  return queryOptions({
    queryFn: () => getAdminAnalytics(parameters),
    queryKey: adminAnalyticsQueryKey.overview(parameters),
    retry: false,
  });
}

export function getAdminMarketingLeadsQueryOptions(parameters: AdminMarketingLeadsParams = {}) {
  return queryOptions({
    queryFn: async () => {
      return listAdminMarketingLeads(parameters);
    },
    queryKey: adminAnalyticsQueryKey.marketingLeads.list(parameters),
    retry: false,
  });
}

export function useExportAdminMarketingLeadsMutation() {
  return useMutation({
    mutationFn: (parameters: AdminMarketingLeadsExportParams = {}) =>
      exportAdminMarketingLeads(parameters),
  });
}
