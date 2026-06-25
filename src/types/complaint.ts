export type ComplaintStatus
  = | 'RAISED'
    | 'REFUNDED'
    | 'REJECTED'
    | 'RETURN_ADDRESS_PROVIDED'
    | 'RETURN_APPROVED'
    | 'RETURN_IN_TRANSIT'
    | 'RETURN_RECEIVED'
    | 'UNDER_REVIEW';

export type AdminComplaintStatus
  = | 'REFUNDED'
    | 'REJECTED'
    | 'RETURN_APPROVED'
    | 'RETURN_RECEIVED';

export interface Complaint {
  id: string;
  buyerId: string;
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
  adminNotes?: string;
  status: AdminComplaintStatus;
}
