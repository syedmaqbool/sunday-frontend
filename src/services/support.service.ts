import { authInstance } from "@/services/ky.instance";
import type {
  CreateTicketPayload,
  SendMessagePayload,
  SupportMessage,
  SupportTicket,
} from "@/types/support";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listSupportTickets() {
  return authInstance
    .get("/api/v1/support-tickets")
    .json<PaginatedResponse<SupportTicket>>();
}

export function createSupportTicket(payload: CreateTicketPayload) {
  return authInstance
    .post("/api/v1/support-tickets", { json: payload })
    .json<Response<SupportTicket>>();
}

export function listSupportMessages(ticketId: string) {
  return authInstance
    .get(`/api/v1/support-tickets/${ticketId}/messages`)
    .json<PaginatedResponse<SupportMessage>>();
}

export function sendSupportMessage(
  ticketId: string,
  payload: SendMessagePayload,
) {
  return authInstance
    .post(`/api/v1/support-tickets/${ticketId}/messages`, { json: payload })
    .json<Response<SupportMessage>>();
}
