export interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  offerId: string;
  buyerFullName: string;
  sellerFullName: string;
  listingTitle: string;
  lastMessageContent: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  flagReasons: string[];
  isFlagged: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
