import type { CreateTicketPayload } from '@/types/support.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSupportMessagesOptions,
  getSupportTicketsOptions,
  supportQueryKey,
} from '@/queries/support.query';
import {
  createSupportTicket,
  sendSupportMessage,
} from '@/services/support.service';

export {
  getSupportMessagesOptions,
  getSupportTicketsOptions,
} from '@/queries/support.query';

// Get tickets
export function useSupportTicketsQuery() {
  return useQuery(getSupportTicketsOptions());
}

// Create ticket
export function useCreateSupportTicketMutation() {
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
export function useSupportMessagesQuery(ticketId?: string) {
  return useQuery(getSupportMessagesOptions(ticketId));
}

// Send reply
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

      qc.invalidateQueries({
        queryKey: supportQueryKey.tickets(),
      });
    },
  });
}
