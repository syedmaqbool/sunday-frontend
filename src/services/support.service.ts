import type { PaginatedResponse, Response } from '@/types/response.type';
import type {
  CreateTicketPayload,
  SendMessagePayload,
  SupportMessage,
  SupportTicket,
} from '@/types/support.type';
import { authInstance } from '@/services/ky.instance';

export function listSupportTickets(): Promise<PaginatedResponse<SupportTicket>> {
  return authInstance
    .get('/api/v1/support-tickets')
    .json<PaginatedResponse<SupportTicket>>();
}

export function createSupportTicket(payload: CreateTicketPayload): Promise<Response<SupportTicket>> {
  return authInstance
    .post('/api/v1/support-tickets', { json: payload })
    .json<Response<SupportTicket>>();
}

export function listSupportMessages(ticketId: string): Promise<PaginatedResponse<SupportMessage>> {
  return authInstance
    .get(`/api/v1/support-tickets/${ticketId}/messages`)
    .json<PaginatedResponse<SupportMessage>>();
}

export function sendSupportMessage(
  ticketId: string,
  payload: SendMessagePayload,
): Promise<Response<SupportMessage>> {
  return authInstance
    .post(`/api/v1/support-tickets/${ticketId}/messages`, { json: payload })
    .json<Response<SupportMessage>>();
}
