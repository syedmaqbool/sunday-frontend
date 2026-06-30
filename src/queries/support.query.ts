import { queryOptions } from '@tanstack/react-query';
import {
  listSupportMessages,
  listSupportTickets,
} from '@/services/support.service';

export const supportQueryKey = {
  messages: (ticketId?: string) => ['support-messages', ticketId] as const,
  tickets: () => ['support-tickets'] as const,
};

export function getSupportTicketsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listSupportTickets();
      return response.data;
    },
    queryKey: supportQueryKey.tickets(),
  });
}

export function getSupportMessagesOptions(ticketId?: string) {
  return queryOptions({
    enabled: !!ticketId,
    queryFn: async () => {
      const response = await listSupportMessages(ticketId!);
      return response.data;
    },
    queryKey: supportQueryKey.messages(ticketId),
  });
}
