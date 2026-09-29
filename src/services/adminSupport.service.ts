import type { PaginatedResponse, Response } from '@/types/response.type';
import type {
  AdminReplyPayload,
  AdminSupportMessageParameters,
  AdminSupportTicketParameters,
  SupportTicket,
  SupportTicketMessage,
  UpdateSupportTicketStatusPayload,
} from '@/types/support.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminSupportTickets(
  parameters: AdminSupportTicketParameters = {},
) {
  return authInstance
    .get('/api/v1/admin/support-tickets', { searchParams: parameters })
    .json<PaginatedResponse<SupportTicket>>();
}

export function listAdminSupportMessages(
  ticketId: string,
  parameters: AdminSupportMessageParameters = {},
) {
  return authInstance
    .get(`/api/v1/admin/support-tickets/${ticketId}/messages`, {
      searchParams: parameters,
    })
    .json<PaginatedResponse<SupportTicketMessage>>();
}

export function replyToSupportTicket(ticketId: string, content: AdminReplyPayload['content']) {
  return authInstance
    .post(`/api/v1/admin/support-tickets/${ticketId}/messages`, {
      json: { content } satisfies AdminReplyPayload,
    })
    .json<Response<SupportTicketMessage>>();
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: UpdateSupportTicketStatusPayload['status'],
) {
  return authInstance
    .patch(`/api/v1/admin/support-tickets/${ticketId}/status`, {
      json: { status } satisfies UpdateSupportTicketStatusPayload,
    })
    .json<Response>();
}
