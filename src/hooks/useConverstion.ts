import { useQuery } from '@tanstack/react-query';
import {
  getConversationMessagesOptions,
  getConversationsOptions,
} from '@/queries/conversation.query';

export {
  getConversationMessagesOptions,
  getConversationsOptions,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '@/queries/conversation.query';

export function useConversationsQuery() {
  return useQuery(getConversationsOptions());
}

export function useConversationMessagesQuery(conversationId?: string) {
  return useQuery(getConversationMessagesOptions(conversationId));
}
