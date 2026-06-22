import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminSupportService,
  type SupportTicketStatus,
} from "@/services/adminSupport.service";

const TICKETS_KEY = ["admin-support-tickets"];
const messagesKey = (ticketId: string) => ["admin-support-messages", ticketId];

export const useAdminSupportTickets = () =>
  useQuery({
    queryKey: TICKETS_KEY,
    queryFn: async () => {
      const res = await adminSupportService.listTickets({ size: 100 });
      return res.data;
    },
    refetchInterval: 5000, // polling — no websocket client wired up yet
  });

export const useAdminSupportMessages = (ticketId: string | null) =>
  useQuery({
    queryKey: messagesKey(ticketId ?? ""),
    queryFn: async () => {
      const res = await adminSupportService.listMessages(ticketId!, { size: 100 });
      return res.data;
    },
    enabled: !!ticketId,
    refetchInterval: ticketId ? 3000 : false,
  });

export const useReplyToSupportTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      adminSupportService.reply(ticketId, content),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: messagesKey(variables.ticketId) });
      qc.invalidateQueries({ queryKey: TICKETS_KEY });
    },
  });
};

export const useUpdateSupportTicketStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) =>
      adminSupportService.updateStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TICKETS_KEY });
    },
  });
};