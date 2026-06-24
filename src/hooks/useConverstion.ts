import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from "@/services/conversation.service";

const CONVERSATIONS_KEY = ["conversations"];

export const useConversations = () =>
  useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const res = await listConversations();
      return res.data;
    },
  });

export const useConversationMessages = (conversationId?: string) =>
  useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await listConversationMessages(conversationId!);
      return res.data;
    },
    enabled: !!conversationId,
  });

export const useSendMessage = () => {
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
        queryKey: ["messages", variables.conversationId],
      });

      qc.invalidateQueries({
        queryKey: CONVERSATIONS_KEY,
      });
    },
  });
};

export const useMarkConversationRead = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead(conversationId),

    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({
        queryKey: ["messages", conversationId],
      });

      qc.invalidateQueries({
        queryKey: CONVERSATIONS_KEY,
      });
    },
  });
};
