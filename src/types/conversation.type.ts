import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  GetConversationMessagesResponses,
  GetMyConversationsResponses,
  SendConversationMessageData,
} from '@/types/generated-api';

export type Conversation = ApiResponseItem<GetMyConversationsResponses>;
export type Message = ApiResponseItem<GetConversationMessagesResponses>;
export type SendConversationMessagePayload = ApiRequestBody<SendConversationMessageData>;
