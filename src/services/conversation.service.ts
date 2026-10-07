import type {
  Conversation,
  Message,
  SendConversationMessagePayload,
  StartConversation,
  StartConversationPayload,
} from '@/types/conversation.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listConversations(): Promise<Response<Conversation[]>> {
  return authInstance
    .get('/api/v1/me/conversations')
    .json<Response<Conversation[]>>();
}

export function startConversation(payload: StartConversationPayload): Promise<Response<StartConversation>> {
  return authInstance
    .post('/api/v1/me/conversations', { json: payload })
    .json<Response<StartConversation>>();
}

export function listConversationMessages(conversationId: string): Promise<Response<Message[]>> {
  return authInstance
    .get(`/api/v1/me/conversations/${conversationId}/messages`)
    .json<Response<Message[]>>();
}

export function sendConversationMessage(
  conversationId: string,
  content: SendConversationMessagePayload['content'],
): Promise<Response<Message>> {
  return authInstance
    .post(`/api/v1/me/conversations/${conversationId}/messages`, {
      json: { content } satisfies SendConversationMessagePayload,
    })
    .json<Response<Message>>();
}

export function markConversationRead(conversationId: string): Promise<Response<null>> {
  return authInstance
    .post(`/api/v1/me/conversations/${conversationId}/read`)
    .json<Response<null>>();
}
