import type { ApiRequestQuery, ApiResponseItem } from './api.type';
import type { GetAdminFlaggedMessagesData, GetAdminFlaggedMessagesResponses } from '@/types/generated-api';

export type FlaggedMessage = ApiResponseItem<GetAdminFlaggedMessagesResponses>;
export type FlaggedMessagesParameters = Partial<ApiRequestQuery<GetAdminFlaggedMessagesData>>;
