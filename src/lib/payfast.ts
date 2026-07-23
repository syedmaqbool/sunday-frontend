import type { PayFastPayment } from '@/types/checkout.type';
import type { Order } from '@/types/order.type';

export const PAYFAST_STATUS_POLL_INTERVAL_MS = 15_000;
export const MAX_PAYFAST_STATUS_POLLS = 3;

export function getPayFastStatusPollDelay(
  status: Order['paymentStatus'],
  attempt: number,
) {
  if (status !== 'PENDING' || attempt >= MAX_PAYFAST_STATUS_POLLS)
    return null;

  return PAYFAST_STATUS_POLL_INTERVAL_MS;
}

export function isPayFastRetryableStatus(status: Order['paymentStatus']) {
  return status === 'UNPAID' || status === 'FAILED';
}

export function isOrderEligibleForPayFastRetry(
  order: Pick<Order, 'expiresAt' | 'paymentStatus' | 'status'>,
  options: { pendingPollExhausted?: boolean } = {},
) {
  if (order.status !== 'AWAITING_PAYMENT')
    return false;
  if (order.expiresAt && new Date(order.expiresAt) <= new Date())
    return false;

  if (isPayFastRetryableStatus(order.paymentStatus))
    return true;

  // A PENDING order normally means a webhook is still coming, but if polling
  // gave up and it's still pending, the buyer likely abandoned the PayFast
  // form entirely — nothing will ever resolve that, so allow another attempt.
  return order.paymentStatus === 'PENDING' && Boolean(options.pendingPollExhausted);
}

export function submitPayFast(payment: PayFastPayment) {
  const paymentUrl = new URL(payment.paymentUrl, location.href);
  const isExternalHttpUrl
    = ['http:', 'https:'].includes(paymentUrl.protocol)
      && paymentUrl.origin !== location.origin;

  if (!isExternalHttpUrl)
    throw new Error('PayFast payment URL is invalid.');

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl.href;

  for (const [name, value] of Object.entries(payment.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }

  document.body.append(form);
  form.submit();
}
