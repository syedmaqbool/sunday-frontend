import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  conversationsQueryKey,
  getConversationMessagesOptions,
  getConversationsOptions,
} from '@/queries/conversation.query';

export {
  getConversationMessagesOptions,
  getConversationsOptions,
} from '@/queries/conversation.query';
import {
  markConversationRead,
  sendConversationMessage,
} from '@/services/conversation.service';

export function useConversationsQuery() {
  return useQuery(getConversationsOptions());
}

export function useConversationMessagesQuery(conversationId?: string) {
  return useQuery(getConversationMessagesOptions(conversationId));
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

      qc.invalidateQueries({
        queryKey: conversationsQueryKey.list(),
      });
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

      qc.invalidateQueries({
        queryKey: conversationsQueryKey.list(),
      });
    },
  });
}
