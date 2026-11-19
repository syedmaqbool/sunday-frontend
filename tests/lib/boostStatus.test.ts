import type { BoostPurchaseStatusSource } from '@/types/boost.type';
import { describe, expect, it } from 'vite-plus/test';
import {
  canStartBoostPayFastPayment,
  getBoostPaymentDeadline,
  getBoostPurchaseDisplayStatus,
  isBoostPaidAndWithinActiveWindow,
} from '@/lib/boostStatus';

function purchaseSource(overrides: Partial<BoostPurchaseStatusSource>): BoostPurchaseStatusSource {
  return {
    allBoostsEnded: false,
    campaignEndsAt: null,
    hasActiveBoost: false,
    paymentDeadline: null,
    status: 'APPROVED',
    ...overrides,
  };
}

describe('boost status', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');

  it('counts a boost as active only when paid and inside its start and end times', () => {
    expect(
      isBoostPaidAndWithinActiveWindow(
        {
          paymentStatus: 'PAID',
          endsAt: '2026-10-20T12:00:00.000Z',
          startsAt: '2026-10-18T11:00:00.000Z',
        },
        now,
      ),
    ).toBe(true);
    expect(
      isBoostPaidAndWithinActiveWindow(
        {
          paymentStatus: 'MOCK',
          endsAt: '2026-10-20T12:00:00.000Z',
          startsAt: '2026-10-18T11:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
    expect(
      isBoostPaidAndWithinActiveWindow(
        {
          paymentStatus: 'PAID',
          endsAt: '2026-10-20T12:00:00.000Z',
          startsAt: '2026-10-18T13:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('uses one purchase status classification for active and review states', () => {
    const approved = purchaseSource({ hasActiveBoost: true });

    expect(getBoostPurchaseDisplayStatus(approved, now)).toBe('ACTIVE');
    expect(getBoostPurchaseDisplayStatus({ ...approved, status: 'REFUNDED' }, now)).toBe(
      'REFUNDED',
    );
  });

  it('shows an approved purchase whose boosts have all ended as ended, not active', () => {
    expect(getBoostPurchaseDisplayStatus(purchaseSource({ allBoostsEnded: true }), now)).toBe(
      'ENDED',
    );
    expect(getBoostPurchaseDisplayStatus(purchaseSource({}), now)).toBe('APPROVED');
  });
});

describe('boost PayFast payment window', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');
  const deadlineInWindow = Date.parse('2026-10-18T12:15:00.000Z');
  const deadlinePassed = Date.parse('2026-10-18T12:00:00.000Z');

  it('derives the deadline from the earliest boost creation time plus 30 minutes', () => {
    expect(getBoostPaymentDeadline(Date.parse('2026-10-18T11:45:00.000Z'))).toBe(deadlineInWindow);
    expect(getBoostPaymentDeadline(null)).toBeNull();
  });

  it('allows PayFast payment only while the 30 minute deadline has not passed', () => {
    const pending = { paymentDeadline: deadlineInWindow, status: 'PENDING_PAYMENT' as const };

    expect(canStartBoostPayFastPayment(purchaseSource(pending), now)).toBe(true);
    expect(
      canStartBoostPayFastPayment(
        purchaseSource({ ...pending, paymentDeadline: deadlinePassed }),
        now,
      ),
    ).toBe(false);
  });

  it('shows a pending purchase as awaiting PayFast inside the window and expired after it', () => {
    const pending = { paymentDeadline: deadlineInWindow, status: 'PENDING_PAYMENT' as const };

    expect(getBoostPurchaseDisplayStatus(purchaseSource(pending), now)).toBe('PENDING_PAYMENT');
    expect(
      getBoostPurchaseDisplayStatus(
        purchaseSource({ ...pending, paymentDeadline: deadlinePassed }),
        now,
      ),
    ).toBe('PAYMENT_EXPIRED');
  });

  it('never allows PayFast payment for a purchase that is not pending payment', () => {
    expect(
      canStartBoostPayFastPayment(
        purchaseSource({ paymentDeadline: deadlineInWindow, status: 'APPROVED' }),
        now,
      ),
    ).toBe(false);
  });
});

describe('boost PayFast campaign end', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');
  // A custom campaign still inside its 30 minute payment window whose selected end date passed.
  const endedPendingCampaign = purchaseSource({
    campaignEndsAt: Date.parse('2026-10-18T11:55:00.000Z'),
    paymentDeadline: Date.parse('2026-10-18T12:10:00.000Z'),
    status: 'PENDING_PAYMENT',
  });

  it('shows a pending campaign whose selected end date has passed as ended, not awaiting payment', () => {
    expect(getBoostPurchaseDisplayStatus(endedPendingCampaign, now)).toBe('ENDED');
  });

  it('never allows PayFast payment for a pending campaign whose selected end date has passed', () => {
    expect(canStartBoostPayFastPayment(endedPendingCampaign, now)).toBe(false);
  });

  it('treats a pending campaign as ended at the exact millisecond of its end date', () => {
    const atEndsAt = purchaseSource({
      campaignEndsAt: now,
      paymentDeadline: Date.parse('2026-10-18T12:10:00.000Z'),
      status: 'PENDING_PAYMENT',
    });

    expect(getBoostPurchaseDisplayStatus(atEndsAt, now)).toBe('ENDED');
    expect(canStartBoostPayFastPayment(atEndsAt, now)).toBe(false);
  });

  it('keeps a pending campaign awaiting PayFast while its end date has not passed', () => {
    const pendingCampaign = purchaseSource({
      campaignEndsAt: Date.parse('2026-10-25T12:00:00.000Z'),
      paymentDeadline: Date.parse('2026-10-18T12:10:00.000Z'),
      status: 'PENDING_PAYMENT',
    });

    expect(getBoostPurchaseDisplayStatus(pendingCampaign, now)).toBe('PENDING_PAYMENT');
  });
});

describe('boost PayFast package purchases', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');

  it('shows a paid package as active while inside its window', () => {
    expect(
      getBoostPurchaseDisplayStatus(
        purchaseSource({ hasActiveBoost: true, status: 'APPROVED' }),
        now,
      ),
    ).toBe('ACTIVE');
  });

  it('shows a paid package as ended once every boost end date has passed', () => {
    expect(
      getBoostPurchaseDisplayStatus(
        purchaseSource({ allBoostsEnded: true, status: 'APPROVED' }),
        now,
      ),
    ).toBe('ENDED');
  });
});
