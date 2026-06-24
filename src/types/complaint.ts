export type ComplaintStatus =
  | "RAISED"
  | "UNDER_REVIEW"
  | "RETURN_APPROVED"
  | "RETURN_ADDRESS_PROVIDED"
  | "RETURN_IN_TRANSIT"
  | "RETURN_RECEIVED"
  | "REFUNDED"
  | "REJECTED";

export type AdminComplaintStatus =
  | "RETURN_APPROVED"
  | "REJECTED"
  | "RETURN_RECEIVED"
  | "REFUNDED";

export interface Complaint {
  buyerId: string;
  id: string;
  listingId: string;
  orderId: string;
  orderItemId: string;
  sellerId: string;
  adminNotes: string | null;
  buyerFullName: string;
  evidenceUrls: string[];
  expectedReturnDate: string | null;
  listingTitle: string;
  reason: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolverFullName: string | null;
  returnAddress: string | null;
  returnAddressPhone: string | null;
  returnAddressRecipient: string | null;
  returnCarrier: string | null;
  returnInstructions: string | null;
  returnProofUrls: string[];
  returnTracking: string | null;
  sellerFullName: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateComplaintStatusPayload {
  status: AdminComplaintStatus;
  adminNotes?: string;
}
