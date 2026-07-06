import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from '@/services/conversation.service';

export const conversationsQueryKey = {
  all: () => ['conversations'] as const,
  list: () => [...conversationsQueryKey.all(), 'list'] as const,
  messages: (conversationId?: string) =>
    [...conversationsQueryKey.all(), 'messages', 'list', conversationId ?? null] as const,
};

export function getConversationsOptions() {
  return queryOptions({
    queryFn: async () => await listConversations(),
    queryKey: conversationsQueryKey.list(),
  });
}

export function getConversationMessagesOptions(conversationId?: string) {
  return queryOptions({
    enabled: !!conversationId,
    queryFn: async () => await listConversationMessages(conversationId!),
    queryKey: conversationsQueryKey.messages(conversationId),
  });
}

export function useSendMessageMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => sendConversationMessage(conversationId, content),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: conversationsQueryKey.messages(variables.conversationId),
      });
      qc.invalidateQueries({ queryKey: conversationsQueryKey.list() });
    },
  });
}

export function useMarkConversationReadMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead(conversationId),
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({
        queryKey: conversationsQueryKey.messages(conversationId),
      });
      qc.invalidateQueries({ queryKey: conversationsQueryKey.list() });
    },
  });
}
