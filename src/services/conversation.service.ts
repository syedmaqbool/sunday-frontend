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
  return authInstance.get('/api/v1/me/conversations').json<Response<Conversation[]>>();
}

export function startConversation(
  payload: StartConversationPayload,
): Promise<Response<StartConversation>> {
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
  payload: SendConversationMessagePayload,
): Promise<Response<Message>> {
  const endpoint = `/api/v1/me/conversations/${conversationId}/messages`;

  if (payload.attachments?.length) {
    const formData = new FormData();
    if (payload.content?.trim()) {
      formData.append('content', payload.content);
    }
    for (const attachment of payload.attachments) {
      formData.append('attachments', attachment);
    }

    return authInstance.post(endpoint, { body: formData }).json<Response<Message>>();
  }

  return authInstance
    .post(endpoint, {
      json: { content: payload.content ?? '' } satisfies SendConversationMessagePayload,
    })
    .json<Response<Message>>();
}

export function markConversationRead(conversationId: string): Promise<Response<null>> {
  return authInstance
    .post(`/api/v1/me/conversations/${conversationId}/read`)
    .json<Response<null>>();
}
