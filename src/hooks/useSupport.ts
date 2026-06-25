import type { CreateTicketPayload } from '@/types/support';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSupportMessagesOptions,
  getSupportTicketsOptions,
  supportQueryKey,
} from '@/queries/useSupport';
import {
  createSupportTicket,
  sendSupportMessage,
} from '@/services/support.service';

// Get tickets
export function useSupportTickets() {
  return useQuery(getSupportTicketsOptions());
}

// Create ticket
export function useCreateSupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createSupportTicket(payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: supportQueryKey.tickets(),
      });
    },
  });
}

// Get messages
export function useSupportMessages(ticketId?: string) {
  return useQuery(getSupportMessagesOptions(ticketId));
}

// Send reply
export function useSendSupportMessage() {
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

      qc.invalidateQueries({
        queryKey: supportQueryKey.tickets(),
      });
    },
  });
}
