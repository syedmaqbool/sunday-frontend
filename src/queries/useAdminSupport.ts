import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listAdminSupportMessages,
  listAdminSupportTickets,
  replyToSupportTicket,
  updateSupportTicketStatus,
} from "@/services/adminSupport.service";
import type { SupportTicketStatus } from "@/types/support";

export const adminSupportQueryKey = {
  tickets: () => ["admin-support-tickets"] as const,
  messages: (ticketId: string) => ["admin-support-messages", ticketId] as const,
};

export const getAdminSupportTicketsOptions = () =>
  queryOptions({
    queryKey: adminSupportQueryKey.tickets(),
    queryFn: async () => {
      const res = await listAdminSupportTickets({ size: 100 });
      return res.data;
    },
    refetchInterval: 5000, // polling — no websocket client wired up yet
  });

export const useAdminSupportTickets = () =>
  useQuery(getAdminSupportTicketsOptions());

export const getAdminSupportMessagesOptions = (ticketId: string | null) =>
  queryOptions({
    queryKey: adminSupportQueryKey.messages(ticketId ?? ""),
    queryFn: async () => {
      const res = await listAdminSupportMessages(ticketId!, { size: 100 });
      return res.data;
    },
    enabled: !!ticketId,
    refetchInterval: ticketId ? 3000 : false,
  });

export const useAdminSupportMessages = (ticketId: string | null) =>
  useQuery(getAdminSupportMessagesOptions(ticketId));

export const useReplyToSupportTicket = () => {
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
};

export const useUpdateSupportTicketStatus = () => {
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
};
