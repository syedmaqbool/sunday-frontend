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

export function submitPayFast(payment: PayFastPayment) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payment.paymentUrl;

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
