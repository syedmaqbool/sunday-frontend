import type {
  AdminMarketingLeadsExportParams,
  AdminMarketingLeadsParams,
} from '@/types/adminAnalytics.type';
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
  overview: () => [...adminAnalyticsQueryKey.all(), 'overview'] as const,
};

export function getAdminAnalyticsQueryOptions() {
  return queryOptions({
    queryFn: getAdminAnalytics,
    queryKey: adminAnalyticsQueryKey.overview(),
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
