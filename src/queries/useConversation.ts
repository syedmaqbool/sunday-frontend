import { queryOptions } from '@tanstack/react-query';
import {
  listConversationMessages,
  listConversations,
} from '@/services/conversation.service';

export const conversationsQueryKey = {
  list: () => ['conversations'] as const,
  messages: (conversationId?: string) => ['messages', conversationId] as const,
};

export function getConversationsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listConversations();
      return response.data;
    },
    queryKey: conversationsQueryKey.list(),
  });
}

export function getConversationMessagesOptions(conversationId?: string) {
  return queryOptions({
    enabled: !!conversationId,
    queryFn: async () => {
      const response = await listConversationMessages(conversationId!);
      return response.data;
    },
    queryKey: conversationsQueryKey.messages(conversationId),
  });
}
