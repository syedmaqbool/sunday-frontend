import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPayFastStatusPollDelay,
  submitPayFast,
} from '@/lib/payfast';

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
});
