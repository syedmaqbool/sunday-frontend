export interface Conversation {
  id: string;
  buyerId: string;
  listingId: string;
  offerId: string;
  sellerId: string;
  buyerFullName: string;
  lastMessageContent: string | null;
  listingTitle: string;
  sellerFullName: string;
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
