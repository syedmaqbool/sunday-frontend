import { authInstance } from "@/services/ky.instance";
import type {
  SupportTicket,
  SupportTicketMessage,
  SupportTicketStatus,
} from "@/types/support";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listAdminSupportTickets(
  params: { page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/admin/support-tickets", { searchParams: params })
    .json<PaginatedResponse<SupportTicket>>();
}

export function listAdminSupportMessages(
  ticketId: string,
  params: { page?: number; size?: number } = {},
) {
  return authInstance
    .get(`/api/v1/admin/support-tickets/${ticketId}/messages`, {
      searchParams: params,
    })
    .json<PaginatedResponse<SupportTicketMessage>>();
}

export function replyToSupportTicket(ticketId: string, content: string) {
  return authInstance
    .post(`/api/v1/admin/support-tickets/${ticketId}/messages`, {
      json: { content },
    })
    .json<Response<SupportTicketMessage>>();
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
) {
  return authInstance
    .patch(`/api/v1/admin/support-tickets/${ticketId}/status`, {
      json: { status },
    })
    .json<Response>();
}
