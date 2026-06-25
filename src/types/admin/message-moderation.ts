export interface FlaggedMessage {
  id: string;
  buyerId: string;
  conversationId: string;
  listingId: string;
  sellerId: string;
  senderId: string;
  buyerFullName: string;
  content: string;
  conversationCreatedAt: string;
  flagReasons: string[];
  isFlagged: boolean;
  listingTitle: string;
  readAt: string | null;
  sellerFullName: string;
  createdAt: string;
  updatedAt: string;
}
