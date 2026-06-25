import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from '@/services/conversation.service';

const CONVERSATIONS_KEY = ['conversations'];

export function useConversations() {
  return useQuery({
    queryFn: async () => {
      const response = await listConversations();
      return response.data;
    },
    queryKey: CONVERSATIONS_KEY,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    enabled: !!conversationId,
    queryFn: async () => {
      const response = await listConversationMessages(conversationId!);
      return response.data;
    },
    queryKey: ['messages', conversationId],
  });
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
        queryKey: ['messages', variables.conversationId],
      });

      qc.invalidateQueries({
        queryKey: CONVERSATIONS_KEY,
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
        queryKey: ['messages', conversationId],
      });

      qc.invalidateQueries({
        queryKey: CONVERSATIONS_KEY,
      });
    },
  });
}
