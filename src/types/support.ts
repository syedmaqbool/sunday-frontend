export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

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
  subject: string;
  content: string;
}

export interface SendMessagePayload {
  content: string;
}
