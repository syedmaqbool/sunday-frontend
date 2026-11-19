import type { PayFastCheckout } from '@/types/checkout.type';
import type { Order } from '@/types/order.type';
import type { PayFastPayableOrder } from '@/types/payfast.type';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import {
  canStartPayFastPayment,
  isPayFastCheckoutEnabled,
  startPayFastHandoff,
  submitPayFastCheckout,
} from '@/lib/payfast';

const FUTURE = '2099-01-01T00:00:00.000Z';
const PAST = '2000-01-01T00:00:00.000Z';

function orderState(overrides: Partial<PayFastPayableOrder> = {}): PayFastPayableOrder {
  return {
    expiresAt: FUTURE,
    manualPaymentSubmission: undefined,
    paymentStatus: 'UNPAID',
    status: 'AWAITING_PAYMENT',
    ...overrides,
  };
}

describe('isPayFastCheckoutEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off unless the PayFast checkout flag is set to true', () => {
    expect(isPayFastCheckoutEnabled()).toBe(false);

    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'false');
    expect(isPayFastCheckoutEnabled()).toBe(false);

    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'true');
    expect(isPayFastCheckoutEnabled()).toBe(true);
  });
});

describe('canStartPayFastPayment', () => {
  const now = Date.parse('2026-11-19T12:00:00.000Z');

  it('allows an unpaid or failed or pending order with no manual submission before its deadline', () => {
    expect(canStartPayFastPayment(orderState(), now)).toBe(true);
    expect(canStartPayFastPayment(orderState({ paymentStatus: 'FAILED' }), now)).toBe(true);
    expect(canStartPayFastPayment(orderState({ paymentStatus: 'PENDING' }), now)).toBe(true);
  });

  it('does not allow paid, cancelled, or expired orders', () => {
    expect(canStartPayFastPayment(orderState({ paymentStatus: 'PAID' }), now)).toBe(false);
    expect(canStartPayFastPayment(orderState({ status: 'CANCELLED' }), now)).toBe(false);
    expect(canStartPayFastPayment(orderState({ expiresAt: PAST }), now)).toBe(false);
    expect(canStartPayFastPayment(orderState({ expiresAt: null }), now)).toBe(false);
  });

  it('does not allow orders that have a manual payment submission', () => {
    expect(
      canStartPayFastPayment(
        orderState({
          manualPaymentSubmission: {
            createdAt: '2026-09-08T00:00:00.000Z',
            id: 'submission-id',
            orderId: 'order-id',
            proofFileId: 'proof-id',
            reviewNote: null,
            reviewedAt: null,
            status: 'REJECTED',
            updatedAt: '2026-09-08T00:00:00.000Z',
          } as Order['manualPaymentSubmission'],
        }),
        now,
      ),
    ).toBe(false);
  });
});

describe('submitPayFastCheckout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('posts every checkout field to the PayFast payment URL without a screenshot', () => {
    const submittedForms: HTMLFormElement[] = [];
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (
      this: HTMLFormElement,
    ) {
      submittedForms.push(this);
    });

    submitPayFastCheckout({
      accessToken: 'access-token',
      amount: 1500,
      basketId: '11111111-1111-4111-8111-111111111111',
      currencyCode: 'PKR',
      fields: { BASKET_ID: '11111111-1111-4111-8111-111111111111', TOKEN: 'access-token' },
      paymentUrl: 'https://payfast.example/checkout',
    });

    expect(submittedForms).toHaveLength(1);
    const [form] = submittedForms;
    expect(form.method.toLowerCase()).toBe('post');
    expect(form.action).toBe('https://payfast.example/checkout');
    const values = Object.fromEntries(
      Array.from(form.querySelectorAll('input')).map(input => [input.name, input.value]),
    );
    expect(values).toEqual({
      BASKET_ID: '11111111-1111-4111-8111-111111111111',
      TOKEN: 'access-token',
    });
  });
});

describe('startPayFastHandoff', () => {
  const checkout: PayFastCheckout = {
    accessToken: 'access-token',
    amount: 1500,
    basketId: 'order-id',
    currencyCode: 'PKR',
    fields: { BASKET_ID: 'order-id', TOKEN: 'access-token' },
    paymentUrl: 'https://payfast.example/checkout',
  };

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('submits the started checkout to PayFast and reports success', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    const onError = vi.fn();

    const handedOff = await startPayFastHandoff(() => Promise.resolve({ data: checkout }), onError);

    expect(handedOff).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a failed start without submitting to PayFast', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    const error = new Error('PayFast is currently unavailable.');
    const onError = vi.fn();

    const handedOff = await startPayFastHandoff(() => Promise.reject(error), onError);

    expect(handedOff).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);
  });
});
