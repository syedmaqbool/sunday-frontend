import type { Order } from '@/types/order.type';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPayFastStatusPollDelay,
  isOrderEligibleForPayFastRetry,
  submitPayFast,
} from '@/lib/payfast';

function baseOrder(overrides: Partial<Order> = {}): Pick<Order, 'expiresAt' | 'paymentStatus' | 'status'> {
  return {
    paymentStatus: 'UNPAID',
    status: 'AWAITING_PAYMENT',
    expiresAt: null,
    ...overrides,
  };
}

describe('getPayFastStatusPollDelay', () => {
  it('polls pending payments every 15 seconds for three attempts', () => {
    expect(getPayFastStatusPollDelay('PENDING', 0)).toBe(15_000);
    expect(getPayFastStatusPollDelay('PENDING', 1)).toBe(15_000);
    expect(getPayFastStatusPollDelay('PENDING', 2)).toBe(15_000);
  });

  it('stops polling after three attempts or for terminal statuses', () => {
    expect(getPayFastStatusPollDelay('PENDING', 3)).toBeNull();
    expect(getPayFastStatusPollDelay('PAID', 0)).toBeNull();
    expect(getPayFastStatusPollDelay('FAILED', 0)).toBeNull();
  });
});

describe('isOrderEligibleForPayFastRetry', () => {
  it('is eligible when awaiting payment, unpaid/failed, and unexpired', () => {
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'UNPAID' }))).toBe(true);
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'FAILED' }))).toBe(true);

    const futureExpiry = new Date(Date.now() + 60_000).toISOString();
    expect(isOrderEligibleForPayFastRetry(baseOrder({ expiresAt: futureExpiry }))).toBe(true);
  });

  it('is not eligible once paid, or pending with polling not yet exhausted', () => {
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'PAID' }))).toBe(false);
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'PENDING' }))).toBe(false);
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'PENDING' }), { pendingPollExhausted: false })).toBe(false);
  });

  it('is eligible for a pending order once polling has been exhausted (stuck/abandoned payment)', () => {
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'PENDING' }), { pendingPollExhausted: true })).toBe(true);
  });

  it('a pending-exhausted order still respects status and expiry', () => {
    expect(isOrderEligibleForPayFastRetry(
      baseOrder({ paymentStatus: 'PENDING', status: 'CANCELLED' }),
      { pendingPollExhausted: true },
    )).toBe(false);

    const pastExpiry = new Date(Date.now() - 60_000).toISOString();
    expect(isOrderEligibleForPayFastRetry(
      baseOrder({ paymentStatus: 'PENDING', expiresAt: pastExpiry }),
      { pendingPollExhausted: true },
    )).toBe(false);
  });

  it('is not eligible once the order has been cancelled, even if paymentStatus is stale', () => {
    expect(isOrderEligibleForPayFastRetry(baseOrder({ status: 'CANCELLED' }))).toBe(false);
  });

  it('is not eligible once the order has moved past awaiting-payment', () => {
    expect(isOrderEligibleForPayFastRetry(baseOrder({ paymentStatus: 'PAID', status: 'CONFIRMED' }))).toBe(false);
  });

  it('is not eligible once the payment window has expired', () => {
    const pastExpiry = new Date(Date.now() - 60_000).toISOString();
    expect(isOrderEligibleForPayFastRetry(baseOrder({ expiresAt: pastExpiry }))).toBe(false);
  });
});

describe('submitPayFast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits every payment field to the response payment URL unchanged', () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

    submitPayFast({
      fields: {
        BASKET_ID: 'order-uuid',
        CALLBACK_URL: 'https://example.test/cancel?orderId=order-uuid',
        TOKEN: 'token-value',
        TXNAMT: '1250.00',
      },
      paymentUrl: 'https://ipguat.apps.net.pk/transaction',
    });

    const form = document.querySelector('form');
    expect(form?.action).toBe('https://ipguat.apps.net.pk/transaction');
    expect(form?.method).toBe('post');
    expect([...form!.querySelectorAll('input')].map(input => [input.name, input.value])).toEqual([
      ['BASKET_ID', 'order-uuid'],
      ['CALLBACK_URL', 'https://example.test/cancel?orderId=order-uuid'],
      ['TOKEN', 'token-value'],
      ['TXNAMT', '1250.00'],
    ]);
    expect(submit).toHaveBeenCalledOnce();
  });

  it('refuses to submit payment back to the checkout page', () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

    expect(() => submitPayFast({
      fields: { BASKET_ID: 'order-uuid' },
      paymentUrl: '/checkout',
    })).toThrow('PayFast payment URL is invalid.');

    expect(document.querySelector('form')).toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });
});
