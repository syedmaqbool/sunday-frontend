export interface FlaggedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  flagReasons: string[];
  isFlagged: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  listingId: string;
  sellerId: string;
  buyerFullName: string;
  conversationCreatedAt: string;
  listingTitle: string;
  sellerFullName: string;
}
