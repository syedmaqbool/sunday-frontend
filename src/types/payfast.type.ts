import type { Order } from '@/types/order.type';

export type PayFastPayableOrder = Pick<
  Order,
  'expiresAt' | 'manualPaymentSubmission' | 'paymentStatus' | 'status'
>;
