import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupportTicket,
  listSupportMessages,
  listSupportTickets,
  sendSupportMessage,
} from "@/services/support.service";
import type { CreateTicketPayload } from "@/types/support";

const SUPPORT_TICKETS_KEY = ["support-tickets"];

// Get tickets
export const useSupportTickets = () =>
  useQuery({
    queryKey: SUPPORT_TICKETS_KEY,
    queryFn: async () => {
      const res = await listSupportTickets();
      return res.data;
    },
  });

// Create ticket
export const useCreateSupportTicket = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createSupportTicket(payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: SUPPORT_TICKETS_KEY,
      });
    },
  });
};

// Get messages
export const useSupportMessages = (ticketId?: string) =>
  useQuery({
    queryKey: ["support-messages", ticketId],
    queryFn: async () => {
      const res = await listSupportMessages(ticketId!);
      return res.data;
    },
    enabled: !!ticketId,
  });

// Send reply
export const useSendSupportMessage = () => {
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
        queryKey: ["support-messages", variables.ticketId],
      });

      qc.invalidateQueries({
        queryKey: SUPPORT_TICKETS_KEY,
      });
    },
  });
};
