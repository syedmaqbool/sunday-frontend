export type SupportTicketStatus = 'CLOSED' | 'IN_PROGRESS' | 'OPEN' | 'RESOLVED';

export interface SupportTicket {
  id: string;
  lastMessageSenderId: string | null;
  userId: string;
  lastMessageAt: string;
  lastMessageContent: string | null;
  messageCount: number;
  status: SupportTicketStatus;
  subject: string;
  userEmail: string;
  userFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  supportTicketId: string;
  content: string;
  senderFullName: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketMessage = SupportMessage;

export interface CreateTicketPayload {
  content: string;
  subject: string;
}

export interface SendMessagePayload {
  content: string;
}
