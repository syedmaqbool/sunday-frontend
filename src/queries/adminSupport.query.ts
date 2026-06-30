import type { SupportTicketStatus } from '@/types/support.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminSupportMessages,
  listAdminSupportTickets,
  replyToSupportTicket,
  updateSupportTicketStatus,
} from '@/services/adminSupport.service';

export const adminSupportQueryKey = {
  messages: (ticketId: string) => ['admin-support-messages', ticketId] as const,
  tickets: () => ['admin-support-tickets'] as const,
};

export function getAdminSupportTicketsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminSupportTickets({ size: 100 });
      return response.data;
    },
    queryKey: adminSupportQueryKey.tickets(),
    refetchInterval: 5000, // polling — no websocket client wired up yet
  });
}

export function getAdminSupportMessagesOptions(ticketId: string | null) {
  return queryOptions({
    enabled: !!ticketId,
    queryFn: async () => {
      const response = await listAdminSupportMessages(ticketId!, { size: 100 });
      return response.data;
    },
    queryKey: adminSupportQueryKey.messages(ticketId ?? ''),
    refetchInterval: ticketId ? 3000 : false,
  });
}

export function useReplyToSupportTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      content,
    }: {
      ticketId: string;
      content: string;
    }) => replyToSupportTicket(ticketId, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: adminSupportQueryKey.messages(variables.ticketId),
      });
      qc.invalidateQueries({ queryKey: adminSupportQueryKey.tickets() });
    },
  });
}

export function useUpdateSupportTicketStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: SupportTicketStatus;
    }) => updateSupportTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSupportQueryKey.tickets() });
    },
  });
}
