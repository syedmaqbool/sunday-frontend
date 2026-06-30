import type { Conversation, Message } from '@/types/conversation.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listConversations() {
  return authInstance
    .get('/api/v1/me/conversations')
    .json<Response<Conversation[]>>();
}

export function listConversationMessages(conversationId: string) {
  return authInstance
    .get(`/api/v1/me/conversations/${conversationId}/messages`)
    .json<Response<Message[]>>();
}

export function sendConversationMessage(
  conversationId: string,
  content: string,
) {
  return authInstance
    .post(`/api/v1/me/conversations/${conversationId}/messages`, {
      json: { content },
    })
    .json<Response<Message>>();
}

export function markConversationRead(conversationId: string) {
  return authInstance
    .post(`/api/v1/me/conversations/${conversationId}/read`)
    .json<Response<null>>();
}
