import { apiClient } from "@/lib/apiClient";

export interface FlaggedMessage {
  id:                   string;
  conversationId:       string;
  senderId:             string;
  content:              string;
  flagReasons:          string[];
  isFlagged:            boolean;
  readAt:               string | null;
  createdAt:            string;
  updatedAt:            string;
  buyerId:              string;
  listingId:            string;
  sellerId:             string;
  buyerFullName:        string;
  conversationCreatedAt: string;
  listingTitle:         string;
  sellerFullName:       string;
}

interface ListResponse<T> {
  data:       T[];
  pagination: { currentPage: number; lastPage: number; total: number };
}

export const messageModerationService = {
  listFlagged: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ListResponse<FlaggedMessage>>(
      `/api/v1/admin/messages/flagged${query ? `?${query}` : ""}`,
    );
  },

  dismiss: (messageId: string) =>
    apiClient.patch<void>(
      `/api/v1/admin/messages/${messageId}/dismiss`,
      {},
    ),

  delete: (messageId: string) =>
    apiClient.delete<void>(
      `/api/v1/admin/messages/${messageId}`,
    ),
};