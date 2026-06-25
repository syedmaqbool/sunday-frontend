export interface PayoutRun {
  id: string;
  buyerRefundAmount: number;
  buyerRefundItemCount: number;
  generatedBy: string;
  generatedByFullName: string;
  itemCount: number;
  periodEnd: string;
  periodStart: string;
  sellerPayoutAmount: number;
  sellerPayoutItemCount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRunItem {
  id: string;
  buyerId: string | null;
  complaintId: string | null;
  orderId: string | null;
  orderItemId: string | null;
  payoutRunId: string;
  sellerId: string | null;
  userId: string;
  amount: number;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankName: string | null;
  bankSwift: string | null;
  itemType: 'BUYER_REFUND' | 'SELLER_PAYOUT';
  paidAt: string | null;
  periodEnd: string;
  periodStart: string;
  sourceDate: string | null;
  sourceMetadata: {
    orderId?: string;
    orderItemId?: string;
    [key: string]: unknown;
    buyerPlatformFeeAmount?: number;
    complaintReason?: string;
    finalPayoutAmount?: number;
    grossListingPrice?: number;
    listingTitle?: string;
    sellerCommissionShare?: number;
    sellerCommissionShareRate?: number;
  };
  sourceStatus: string;
  sourceType: string;
  status: 'PAID' | 'UNPAID';
  userFullName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  amount: number;
  createdBy: string;
  createdByFullName: string;
  method: string;
  notes: string | null;
  paidAt: string;
  periodEnd: string | null;
  periodStart: string | null;
  reference: string;
  sellerFullName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutRunPayload {
  periodEnd: string;
  periodStart: string;
}

export interface CreateSellerPayoutPayload {
  sellerId: string;
  amount: number;
  method: string;
  notes?: string | null;
  paidAt?: string;
  periodEnd: string;
  periodStart: string;
  reference: string;
  status?: 'CANCELLED' | 'FAILED' | 'PAID' | 'PENDING';
}

export interface UpdatePayoutRunItemStatusPayload {
  paidAt?: string;
  status: 'PAID' | 'UNPAID';
}

export interface PayoutRunListParams {
  page?: number;
  periodEnd?: string;
  periodStart?: string;
  size?: number;
}

export interface PayoutRunItemListParams {
  itemType?: 'BUYER_REFUND' | 'SELLER_PAYOUT';
  page?: number;
  size?: number;
  status?: 'PAID' | 'UNPAID';
}

export interface AdminRefundReportParams {
  payoutRunId?: string;
  page?: number;
  size?: number;
  status?: 'PAID' | 'UNPAID';
}

export interface AdminSellerPayoutListParams {
  sellerId?: string;
  page?: number;
  periodEnd?: string;
  periodStart?: string;
  size?: number;
}
