export type AdminOrderItemStatus
  = 'AWAITING_PAYMENT' | 'CANCELLED' | 'CONFIRMED' | 'DELIVERED' | 'SHIPPED';

export type AdminOrderStatus
  = 'AWAITING_PAYMENT' | 'CANCELLED' | 'CONFIRMED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'PARTIALLY_SHIPPED' | 'SHIPPED';

export type AdminPaymentStatus = 'CANCELLED' | 'FAILED' | 'PAID' | 'PENDING' | 'UNPAID';

export type ManualPaymentSubmissionStatus
  = 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED' | 'SUBMITTED';

export interface AdminManualPaymentSubmission {
  id: string;
  orderId: string;
  proofFileId: string;
  reviewerId: string | null;
  reviewNote: string | null;
  senderAccountNumber: string;
  senderAccountTitle: string;
  status: ManualPaymentSubmissionStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  id: string;
  buyerId: string;
  commissionTierId: string | null;
  listingId: string;
  offerId: string | null;
  orderId: string;
  reservationId: string | null;
  sellerId: string;
  brand: string;
  buyerFullName: string;
  category: string;
  commissionAmount: number;
  commissionRate: number;
  commissionTierName: string | null;
  condition: string;
  currency: 'PKR';
  description: string;
  discountAmount: number;
  expectedDelivery: string | null;
  imageUrl: string;
  platformFeeAmount: number;
  price: number;
  proofImageUrl: string | null;
  quantity: number;
  reservedOfferPrice: number | null;
  sellerFullName: string;
  shippingMethod: string | null;
  size: string;
  status: AdminOrderItemStatus;
  subcategory: string;
  taxAmount: number;
  title: string;
  total: number;
  trackingNumber: string | null;
  receivedAt: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItemStatusCounts {
  completed: number;
  confirmed: number;
  received: number;
  shipped: number;
}

export interface AdminOrder {
  id: string;
  buyerId: string;
  buyerFullName: string;
  cancellationReason: string | null;
  commissionAmount: number;
  currency: 'PKR';
  discountAmount: number;
  discountCode: string | null;
  items: AdminOrderItem[];
  itemStatusCounts: AdminOrderItemStatusCounts;
  manualPaymentSubmissions: AdminManualPaymentSubmission[];
  paymentStatus: AdminPaymentStatus;
  platformFeeAmount: number;
  refundStatus: 'REFUND_FAILED' | 'REFUND_REQUIRED' | 'REFUNDED' | 'REFUNDING' | null;
  restorableListingIds: string[];
  sellerCouponCode: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
  status: AdminOrderStatus;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  cancelledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManualPaymentReviewPayload {
  reviewNote: string;
}

export interface AdminOrderListParameters {
  page?: number;
  size?: number;
  sortOrder?: 'asc' | 'desc';
  status?: AdminOrderStatus;
  sortBy?: 'createdAt' | 'updatedAt';
}

export interface ReservedListing {
  buyerId: string;
  listingId: string;
  reservationId: string;
  sellerId: string;
  buyerFullName: string;
  price: number;
  sellerFullName: string;
  title: string;
  reservationExpiresAt: string;
}
