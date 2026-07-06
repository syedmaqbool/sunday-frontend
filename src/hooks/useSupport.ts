import { useQuery } from '@tanstack/react-query';
import {
  getSupportMessagesOptions,
  getSupportTicketsOptions,
} from '@/queries/support.query';

export {
  getSupportMessagesOptions,
  getSupportTicketsOptions,
  useCreateSupportTicketMutation,
  useSendSupportMessageMutation,
} from '@/queries/support.query';

// Get tickets
export function useSupportTicketsQuery() {
  return useQuery(getSupportTicketsOptions());
}

// Get messages
export function useSupportMessagesQuery(ticketId?: string) {
  return useQuery(getSupportMessagesOptions(ticketId));
}
