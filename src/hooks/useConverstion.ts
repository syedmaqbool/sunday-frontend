import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  conversationsQueryKey,
  getConversationMessagesOptions,
  getConversationsOptions,
} from '@/queries/useConversation';
import {
  markConversationRead,
  sendConversationMessage,
} from '@/services/conversation.service';

export function useConversations() {
  return useQuery(getConversationsOptions());
}

export function useConversationMessages(conversationId?: string) {
  return useQuery(getConversationMessagesOptions(conversationId));
}

export function useSendMessage() {
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

      qc.invalidateQueries({
        queryKey: conversationsQueryKey.list(),
      });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead(conversationId),

    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({
        queryKey: conversationsQueryKey.messages(conversationId),
      });

      qc.invalidateQueries({
        queryKey: conversationsQueryKey.list(),
      });
    },
  });
}
