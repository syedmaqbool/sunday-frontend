import type { ApiRequestBody, ApiResponseData } from './api.type';
import type {
  CancelMyAwaitingPaymentOrderResponses,
  CreateOrderData,
  CreateOrderResponses,
  GetPaymentInstructionsResponses,
  ResubmitMyManualPaymentOrderData,
  ResubmitMyManualPaymentOrderResponses,
  UploadFileResponses,
  ValidateCheckoutDiscountData,
  ValidateCheckoutDiscountResponses,
  ValidateCheckoutSellerCouponData,
  ValidateCheckoutSellerCouponResponses,
} from '@/types/generated-api';

export type ValidateDiscountPayload = ApiRequestBody<ValidateCheckoutDiscountData>;
export type ValidateSellerCouponPayload = ApiRequestBody<ValidateCheckoutSellerCouponData>;
export type ValidateDiscountResult = ApiResponseData<ValidateCheckoutDiscountResponses>;
export type ValidateSellerCouponResult = ApiResponseData<ValidateCheckoutSellerCouponResponses>;
export type AppliedDiscount = Pick<
  ValidateDiscountResult | ValidateSellerCouponResult,
  'code' | 'discountAmount' | 'discountType' | 'discountValue'
> & {
  listingIdsKey: string;
  source: 'platform' | 'seller';
};
export type CreateOrderPayload = ApiRequestBody<CreateOrderData>;
export type PaymentInstructions = ApiResponseData<GetPaymentInstructionsResponses>;
export type UploadedPaymentProof = ApiResponseData<UploadFileResponses>;
export type CheckoutOrderResult = ApiResponseData<CreateOrderResponses>;
export type CancelOrderResult = ApiResponseData<CancelMyAwaitingPaymentOrderResponses>;
export type ResubmitManualPaymentPayload = ApiRequestBody<ResubmitMyManualPaymentOrderData>;
export type ResubmitManualPaymentResult = ApiResponseData<ResubmitMyManualPaymentOrderResponses>;
