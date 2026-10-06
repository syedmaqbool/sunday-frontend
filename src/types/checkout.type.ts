import type { ApiRequestBody, ApiResponseData } from './api.type';
import type {
  CancelMyAwaitingPaymentOrderResponses,
  CreateOrderData,
  CreateOrderErrors,
  CreateOrderResponses,
  GetPaymentInstructionsResponses,
  QuoteCheckoutData,
  QuoteCheckoutResponses,
  ResubmitMyManualPaymentOrderData,
  ResubmitMyManualPaymentOrderResponses,
  UploadFileResponses,
} from '@/types/generated-api';

export type CheckoutQuotePayload = ApiRequestBody<QuoteCheckoutData>;
export type CheckoutQuote = ApiResponseData<QuoteCheckoutResponses>;
export type CheckoutQuoteConflictResponse = CreateOrderErrors[409] & {
  code: 'APP_CHECKOUT_QUOTE_CHANGED';
  data: { quote: CheckoutQuote };
};
export type CreateOrderPayload = ApiRequestBody<CreateOrderData>;
export type PaymentInstructions = ApiResponseData<GetPaymentInstructionsResponses>;
export type UploadedPaymentProof = ApiResponseData<UploadFileResponses>;
export type CheckoutOrderResult = ApiResponseData<CreateOrderResponses>;
export type CancelOrderResult = ApiResponseData<CancelMyAwaitingPaymentOrderResponses>;
export type ResubmitManualPaymentPayload = ApiRequestBody<ResubmitMyManualPaymentOrderData>;
export type ResubmitManualPaymentResult = ApiResponseData<ResubmitMyManualPaymentOrderResponses>;
