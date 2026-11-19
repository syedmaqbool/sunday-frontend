import type { PayFastCheckout } from '@/types/checkout.type';
import type { PayFastPayableOrder } from '@/types/payfast.type';

// Matches the backend cancellation reason written when PayFast launches (order-expiry.repository.ts).
// The generated API type is string | null, so keep this constant in step with that union.
export const PAYFAST_LAUNCH_CANCELLATION_REASON = 'PAYFAST_LAUNCH';

export function isPayFastCheckoutEnabled() {
  return import.meta.env.VITE_PAYFAST_CHECKOUT_ENABLED === 'true';
}

// Orders created through the manual flow always carry a submission, so an order without one is
// a PayFast order. Backend retry is idempotent, so FAILED and PENDING (abandoned) are payable too.
export function canStartPayFastPayment(order: PayFastPayableOrder, now = Date.now()) {
  if (order.manualPaymentSubmission) return false;
  if (order.status !== 'AWAITING_PAYMENT' || order.paymentStatus === 'PAID') return false;
  if (!order.expiresAt) return false;

  return Date.parse(order.expiresAt) > now;
}

export function submitPayFastCheckout({ fields, paymentUrl }: PayFastCheckout) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }

  document.body.append(form);
  form.submit();
}

// Starts a hosted PayFast checkout and hands the buyer over. Resolves true once the form is
// submitted; a start failure goes to onStartError and nothing is submitted.
export async function startPayFastHandoff(
  startCheckout: () => Promise<{ data: PayFastCheckout }>,
  onStartError: (error: unknown) => void | Promise<void>,
) {
  try {
    const response = await startCheckout();
    submitPayFastCheckout(response.data);
    return true;
  } catch (error: unknown) {
    await onStartError(error);
    return false;
  }
}
