export interface PayoutRun {
  id: string;
  buyerRefundAmount: number;
  buyerRefundItemCount: number;
  generatedByFullName: string;
  itemCount: number;
  periodEnd: string;
  periodStart: string;
  sellerPayoutAmount: number;
  sellerPayoutItemCount: number;
  totalAmount: number;
  generatedBy: string;
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
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  amount: number;
  createdByFullName: string;
  method: string;
  notes: string | null;
  periodEnd: string | null;
  periodStart: string | null;
  reference: string;
  sellerFullName: string;
  status: string;
  paidAt: string;
  createdAt: string;
  createdBy: string;
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
  periodEnd: string;
  periodStart: string;
  reference: string;
  status?: 'CANCELLED' | 'FAILED' | 'PAID' | 'PENDING';
  paidAt?: string;
}

export interface UpdatePayoutRunItemStatusPayload {
  status: 'PAID' | 'UNPAID';
  paidAt?: string;
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
