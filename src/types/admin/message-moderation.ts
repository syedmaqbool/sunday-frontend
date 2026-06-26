export interface FlaggedMessage {
  id: string;
  buyerId: string;
  conversationId: string;
  listingId: string;
  sellerId: string;
  senderId: string;
  buyerFullName: string;
  content: string;
  flagReasons: string[];
  isFlagged: boolean;
  listingTitle: string;
  sellerFullName: string;
  conversationCreatedAt: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
