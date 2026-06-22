
import { apiClient } from "@/lib/apiClient";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id:                   string;
  lastMessageSenderId:  string | null;
  userId:               string;
  lastMessageAt:        string;
  lastMessageContent:   string | null;
  messageCount:         number;
  status:               SupportTicketStatus;
  subject:              string;
  userEmail:            string;
  userFullName:         string;
  createdAt:            string;
  updatedAt:            string;
}

export interface SupportTicketMessage {
  id:               string;
  senderId:         string;
  supportTicketId:  string;
  content:          string;
  senderFullName:   string;
  createdAt:        string;
  updatedAt:        string;
}

interface ListResponse<T> {
  data:       T[];
  pagination: { currentPage: number; lastPage: number; total: number };
}
interface ItemResponse<T> {
  data: T;
}

export const adminSupportService = {
  listTickets: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ListResponse<SupportTicket>>(
      `/api/v1/admin/support-tickets${query ? `?${query}` : ""}`,
    );
  },

  listMessages: (ticketId: string, params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ListResponse<SupportTicketMessage>>(
      `/api/v1/admin/support-tickets/${ticketId}/messages${query ? `?${query}` : ""}`,
    );
  },

  reply: (ticketId: string, content: string) =>
    apiClient.post<ItemResponse<SupportTicketMessage>>(
      `/api/v1/admin/support-tickets/${ticketId}/messages`,
      { content },
    ),

  updateStatus: (ticketId: string, status: SupportTicketStatus) =>
    apiClient.patch<void>(
      `/api/v1/admin/support-tickets/${ticketId}/status`,
      { status },
    ),
};

