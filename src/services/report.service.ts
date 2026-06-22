import { apiClient } from "@/lib/apiClient";

export type ReportStatus = "OPEN" | "DISMISSED" | "RESOLVED";

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  listingId: string | null;
  conversationId: string | null;
  messageId: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporterFullName: string;
  reportedUserFullName: string | null;
  listingTitle: string | null;
  messageContent: string | null;
  resolverFullName: string | null;
}

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

interface ItemResponse<T> {
  data: T;
}

export const reportService = {
  list: (params: { status?: ReportStatus; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("size", String(params.size ?? 100));
    return apiClient.get<ListResponse<AdminReport>>(`/api/v1/admin/reports?${query.toString()}`);
  },

  resolve: (reportId: string, payload: { status: "DISMISSED" | "RESOLVED"; adminNotes?: string }) =>
    apiClient.patch<ItemResponse<AdminReport>>(`/api/v1/admin/reports/${reportId}/resolve`, payload),
};