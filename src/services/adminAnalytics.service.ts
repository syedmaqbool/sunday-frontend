import type {
  AdminAnalytics,
  AdminMarketingLead,
  AdminMarketingLeadsExportParams,
  AdminMarketingLeadsParams,
} from '@/types/adminAnalytics.type';
import type { AnalyticsDateRange } from '@/types/analyticsDateRange.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminAnalytics(parameters: AnalyticsDateRange = {}) {
  return authInstance
    .get('/api/v1/admin/analytics', {
      searchParams: parameters as Record<string, string | undefined>,
    })
    .json<Response<AdminAnalytics>>();
}

export function listAdminMarketingLeads(
  parameters: AdminMarketingLeadsParams = {},
) {
  return authInstance
    .get('/api/v1/admin/analytics/marketing-leads', {
      searchParams: parameters as Record<
        string,
        boolean | number | string | undefined
      >,
    })
    .json<PaginatedResponse<AdminMarketingLead>>();
}

export function exportAdminMarketingLeads(
  parameters: AdminMarketingLeadsExportParams = {},
) {
  const searchParams: Record<string, string> = {};

  if (parameters.search)
    searchParams.search = parameters.search;
  if (parameters.leadStatus)
    searchParams.leadStatus = parameters.leadStatus;
  if (parameters.startTime)
    searchParams.startTime = parameters.startTime;
  if (parameters.endTime)
    searchParams.endTime = parameters.endTime;

  return authInstance.get('/api/v1/admin/analytics/marketing-leads/export', {
    searchParams,
  });
}
