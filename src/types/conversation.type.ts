import type { ApiRequestBody, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  GetConversationMessagesResponses,
  GetMyConversationsResponses,
  SendConversationMessageData,
  StartConversationData,
  StartConversationResponses,
} from '@/types/generated-api';

export type Conversation = ApiResponseItem<GetMyConversationsResponses>;
export type Message = ApiResponseItem<GetConversationMessagesResponses>;
export type SendConversationMessagePayload = ApiRequestBody<SendConversationMessageData>;
export type StartConversationPayload = ApiRequestBody<StartConversationData>;
export type StartConversation = ApiResponseData<StartConversationResponses>;
