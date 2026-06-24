import { authInstance } from "@/services/ky.instance";
import type {
  AdminAnalytics,
  AdminMarketingLead,
  AdminMarketingLeadsParams,
} from "@/types/admin/analytics";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function getAdminAnalytics() {
  return authInstance
    .get("/api/v1/admin/analytics")
    .json<Response<AdminAnalytics>>();
}

export function listAdminMarketingLeads(
  params: AdminMarketingLeadsParams = {},
) {
  return authInstance
    .get("/api/v1/admin/analytics/marketing-leads", {
      searchParams: params as Record<
        string,
        string | number | boolean | undefined
      >,
    })
    .json<PaginatedResponse<AdminMarketingLead>>();
}
