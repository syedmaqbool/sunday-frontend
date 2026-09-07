export interface OrderItem {
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
  status: 'CONFIRMED' | 'DELIVERED' | 'SHIPPED';
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

export type ManualPaymentSubmissionStatus
  = 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED' | 'SUBMITTED';

export interface ManualPaymentSubmission {
  id: string;
  orderId: string;
  proofFileId: string;
  reviewNote?: string | null;
  status: ManualPaymentSubmissionStatus;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerFullName: string;
  canCancel?: boolean;
  cancellationReason: string | null;
  canResubmit?: boolean;
  commissionAmount: number;
  currency: 'PKR';
  discountAmount: number;
  discountCode: string | null;
  items: OrderItem[];
  manualPaymentSubmission?: ManualPaymentSubmission | null;
  paymentStatus: 'CANCELLED' | 'FAILED' | 'PAID' | 'PENDING' | 'UNPAID';
  platformFeeAmount: number;
  refundStatus: 'REFUND_FAILED' | 'REFUND_REQUIRED' | 'REFUNDED' | 'REFUNDING' | null;
  sellerCouponCode: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
  status: 'AWAITING_PAYMENT' | 'CANCELLED' | 'CONFIRMED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'PARTIALLY_SHIPPED' | 'SHIPPED';
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  cancelledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderItemStatusPayload {
  expectedDelivery?: string;
  shippingMethod?: string;
  status: 'DELIVERED' | 'SHIPPED';
  trackingNumber?: string;
}
