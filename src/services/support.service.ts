import { apiClient } from "@/lib/apiClient";

export interface SupportTicket {
  id: string;
  lastMessageSenderId: string | null;
  userId: string;
  lastMessageAt: string;
  lastMessageContent: string | null;
  messageCount: number;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  subject: string;
  userEmail: string;
  userFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  supportTicketId: string;
  content: string;
  senderFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPayload {
  subject: string;
  content: string;
}

export interface SendMessagePayload {
  content: string;
}

interface Pagination {
  currentPage: number;
  lastPage: number;
  nextPage: number | null;
  prevPage: number | null;
  perPage: number;
  total: number;
}

interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

interface ItemResponse<T> {
  data: T;
}

export const supportService = {
  // Get all my tickets
  getTickets: () =>
    apiClient.get<ListResponse<SupportTicket>>(
      "/api/v1/support-tickets"
    ),

  // Create ticket
  createTicket: (payload: CreateTicketPayload) =>
    apiClient.post<ItemResponse<SupportTicket>>(
      "/api/v1/support-tickets",
      payload
    ),

  // Get messages of ticket
  getMessages: (ticketId: string) =>
    apiClient.get<ListResponse<SupportMessage>>(
      `/api/v1/support-tickets/${ticketId}/messages`
    ),

  // Send reply
  sendMessage: (ticketId: string, payload: SendMessagePayload) =>
    apiClient.post<ItemResponse<SupportMessage>>(
      `/api/v1/support-tickets/${ticketId}/messages`,
      payload
    ),
};