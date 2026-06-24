import { apiClient } from "@/lib/apiClient";

export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  offerId: string;
  buyerFullName: string;
  sellerFullName: string;
  listingTitle: string;
  lastMessageContent: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  flagReasons: string[];
  isFlagged: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  pagination?: unknown;
  aggregates?: unknown;
}

export const conversationService = {
  getConversations: async () => {
    return apiClient.get<ApiResponse<Conversation[]>>(
      "/api/v1/me/conversations"
    );
  },

  getMessages: async (conversationId: string) => {
    return apiClient.get<ApiResponse<Message[]>>(
      `/api/v1/me/conversations/${conversationId}/messages`
    );
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ) => {
    return apiClient.post<ApiResponse<Message>>(
      `/api/v1/me/conversations/${conversationId}/messages`,
      { content }
    );
  },

  markRead: async (conversationId: string) => {
    return apiClient.post<ApiResponse<null>>(
      `/api/v1/me/conversations/${conversationId}/read`
    );
  },
};