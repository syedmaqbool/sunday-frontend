import type { CreateTicketPayload } from '@/types/support';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSupportTicket,
  listSupportMessages,
  listSupportTickets,
  sendSupportMessage,
} from '@/services/support.service';

const SUPPORT_TICKETS_KEY = ['support-tickets'];

// Get tickets
export function useSupportTickets() {
  return useQuery({
    queryFn: async () => {
      const response = await listSupportTickets();
      return response.data;
    },
    queryKey: SUPPORT_TICKETS_KEY,
  });
}

// Create ticket
export function useCreateSupportTicket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createSupportTicket(payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: SUPPORT_TICKETS_KEY,
      });
    },
  });
}

// Get messages
export function useSupportMessages(ticketId?: string) {
  return useQuery({
    enabled: !!ticketId,
    queryFn: async () => {
      const response = await listSupportMessages(ticketId!);
      return response.data;
    },
    queryKey: ['support-messages', ticketId],
  });
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
        queryKey: ['support-messages', variables.ticketId],
      });

      qc.invalidateQueries({
        queryKey: SUPPORT_TICKETS_KEY,
      });
    },
  });
}
