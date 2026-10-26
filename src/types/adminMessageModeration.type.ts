import type { ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  GetAdminFlaggedConversationData,
  GetAdminFlaggedConversationResponses,
  GetAdminFlaggedMessageHistoryData,
  GetAdminFlaggedMessageHistoryResponses,
  GetAdminFlaggedMessagesData,
  GetAdminFlaggedMessagesResponses,
  GetAdminResolvedFlaggedConversationData,
  GetAdminResolvedFlaggedConversationResponses,
} from '@/types/generated-api';

export type FlaggedMessage = ApiResponseItem<GetAdminFlaggedMessagesResponses>;
export type FlaggedMessagesParameters = Partial<ApiRequestQuery<GetAdminFlaggedMessagesData>>;
export type FlaggedConversationParameters = ApiRequestQuery<GetAdminFlaggedConversationData>;
export type FlaggedConversationResponse = GetAdminFlaggedConversationResponses[200];
export type FlaggedMessageHistory = ApiResponseItem<GetAdminFlaggedMessageHistoryResponses>;
export type FlaggedMessageHistoryParameters = ApiRequestQuery<GetAdminFlaggedMessageHistoryData>;
export type ResolvedFlaggedConversationParameters = ApiRequestQuery<GetAdminResolvedFlaggedConversationData>;
export type ResolvedFlaggedConversationResponse = GetAdminResolvedFlaggedConversationResponses[200];
