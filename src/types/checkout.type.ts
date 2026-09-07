import type { ManualPaymentSubmission, Order } from '@/types/order.type';

export interface ValidateDiscountPayload {
  code: string;
  listingIds: string[];
}

export interface ValidateDiscountResult {
  code: string;
  commissionAmount: number;
  currency: string;
  discountAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  platformFeeAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  totalAfterDiscount: number;
}

export interface ValidateSellerCouponResult {
  sellerId: string;
  code: string;
  currency: string;
  discountAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  eligibleSubtotal: number;
}

export interface CreateOrderPayload {
  proofFileId: string;
  discountCode?: string;
  listingIds: string[];
  sellerCouponCode?: string;
  senderAccountNumber: string;
  senderAccountTitle: string;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
}

export interface PaymentInstructions {
  accountNumber: string;
  accountTitle: string;
  bankOrWalletLabel: string;
}

export interface UploadedPaymentProof {
  id: string;
  filename?: string;
  mimetype?: string;
  size?: number | string;
  url?: string;
}

export interface PayFastPayment {
  fields: Record<string, string>;
  paymentUrl: string;
}

export interface CheckoutOrderResult {
  manualPaymentSubmission: ManualPaymentSubmission;
  order: Order;
}

export interface RetryPayFastResult {
  payment: PayFastPayment;
}

export interface CancelOrderResult {
  restorableListingIds: string[];
}

export interface ResubmitManualPaymentPayload {
  proofFileId: string;
  senderAccountNumber: string;
  senderAccountTitle: string;
}

export type ResubmitManualPaymentResult = ManualPaymentSubmission;
