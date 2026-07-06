import type { CreateTicketPayload } from '@/types/support.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSupportTicket,
  listSupportMessages,
  listSupportTickets,
  sendSupportMessage,
} from '@/services/support.service';

export const supportQueryKey = {
  all: () => ['support'] as const,
  messages: (ticketId?: string) =>
    [...supportQueryKey.all(), 'messages', 'list', ticketId ?? null] as const,
  tickets: () => [...supportQueryKey.all(), 'tickets', 'list'] as const,
};

export function getSupportTicketsOptions() {
  return queryOptions({
    queryFn: async () => await listSupportTickets(),
    queryKey: supportQueryKey.tickets(),
  });
}

export function getSupportMessagesOptions(ticketId?: string) {
  return queryOptions({
    enabled: !!ticketId,
    queryFn: async () => await listSupportMessages(ticketId!),
    queryKey: supportQueryKey.messages(ticketId),
  });
}

export function useCreateSupportTicketMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createSupportTicket(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportQueryKey.tickets() });
    },
  });
}

export function useSendSupportMessageMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      content,
    }: {
      ticketId: string;
      content: string;
    }) => sendSupportMessage(ticketId, { content }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: supportQueryKey.messages(variables.ticketId),
      });
      qc.invalidateQueries({ queryKey: supportQueryKey.tickets() });
    },
  });
}
