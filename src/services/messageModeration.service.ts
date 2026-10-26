import type {
  FlaggedConversationParameters,
  FlaggedConversationResponse,
  FlaggedMessage,
  FlaggedMessagesParameters,
} from '@/types/adminMessageModeration.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listFlaggedMessages(
  parameters: FlaggedMessagesParameters = {},
) {
  return authInstance
    .get('/api/v1/admin/messages/flagged', { searchParams: parameters })
    .json<PaginatedResponse<FlaggedMessage>>();
}

export function getFlaggedConversation(
  messageId: string,
  parameters: FlaggedConversationParameters,
): Promise<FlaggedConversationResponse> {
  return authInstance
    .get(`/api/v1/admin/messages/${messageId}/conversation`, { searchParams: parameters })
    .json<FlaggedConversationResponse>();
}

export function dismissFlaggedMessage(messageId: string) {
  return authInstance
    .patch(`/api/v1/admin/messages/${messageId}/dismiss`)
    .json<Response>();
}

export function deleteMessage(messageId: string) {
  return authInstance
    .delete(`/api/v1/admin/messages/${messageId}`)
    .json<Response>();
}
