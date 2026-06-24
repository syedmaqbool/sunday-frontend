import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  supportService,
  type CreateTicketPayload,
} from "@/services/support.service";

const SUPPORT_TICKETS_KEY = ["support-tickets"];


// Get tickets
export const useSupportTickets = () =>
  useQuery({
    queryKey: SUPPORT_TICKETS_KEY,
    queryFn: async () => {
      const res = await supportService.getTickets();
      return res.data;
    },
  });


// Create ticket
export const useCreateSupportTicket = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      supportService.createTicket(payload),

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
      const res = await supportService.getMessages(ticketId!);
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
    }) =>
      supportService.sendMessage(ticketId, { content }),

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