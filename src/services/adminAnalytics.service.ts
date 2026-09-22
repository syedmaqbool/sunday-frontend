import type {
  AdminAnalytics,
  AdminMarketingLead,
  AdminMarketingLeadsExportParams,
  AdminMarketingLeadsParams,
} from '@/types/adminAnalytics.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminAnalytics() {
  return authInstance
    .get('/api/v1/admin/analytics')
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

  return authInstance.get('/api/v1/admin/analytics/marketing-leads/export', {
    searchParams,
  });
}
