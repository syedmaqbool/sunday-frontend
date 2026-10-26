import type { ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  GetAdminFlaggedConversationData,
  GetAdminFlaggedConversationResponses,
  GetAdminFlaggedMessagesData,
  GetAdminFlaggedMessagesResponses,
} from '@/types/generated-api';

export type FlaggedMessage = ApiResponseItem<GetAdminFlaggedMessagesResponses>;
export type FlaggedMessagesParameters = Partial<ApiRequestQuery<GetAdminFlaggedMessagesData>>;
export type FlaggedConversationParameters = ApiRequestQuery<GetAdminFlaggedConversationData>;
export type FlaggedConversationResponse = GetAdminFlaggedConversationResponses[200];
