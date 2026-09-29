import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateSupportTicketData,
  GetAdminSupportTicketMessagesData,
  GetAdminSupportTicketsData,
  GetMySupportTicketMessagesResponses,
  GetMySupportTicketsResponses,
  ReplyToMySupportTicketData,
  ReplyToSupportTicketAsAdminData,
  UpdateSupportTicketStatusData,
} from '@/types/generated-api';

export type SupportTicket = ApiResponseItem<GetMySupportTicketsResponses>;
export type SupportTicketStatus = SupportTicket['status'];
export type SupportMessage = ApiResponseItem<GetMySupportTicketMessagesResponses>;
export type SupportTicketMessage = SupportMessage;
export type CreateTicketPayload = ApiRequestBody<CreateSupportTicketData>;
export type SendMessagePayload = ApiRequestBody<ReplyToMySupportTicketData>;
export type AdminSupportTicketParameters = Partial<ApiRequestQuery<GetAdminSupportTicketsData>>;
export type AdminSupportMessageParameters = Partial<ApiRequestQuery<GetAdminSupportTicketMessagesData>>;
export type AdminReplyPayload = ApiRequestBody<ReplyToSupportTicketAsAdminData>;
export type UpdateSupportTicketStatusPayload = ApiRequestBody<UpdateSupportTicketStatusData>;
