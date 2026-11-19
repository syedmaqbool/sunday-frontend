import type { BoostPurchase, ListingBoost } from '@/types/boost.type';
import { describe, expect, it } from 'vite-plus/test';
import { deriveBoostPurchaseStatusSource } from '@/hooks/boostPurchaseStatusDerivation';
import { canStartBoostPayFastPayment, getBoostPurchaseDisplayStatus } from '@/lib/boostStatus';

function boost(overrides: Partial<ListingBoost>): ListingBoost {
  return {
    boostPurchaseId: 'purchase-1',
    createdAt: '2026-10-18T11:45:00.000Z',
    durationDays: 3,
    endsAt: '2026-10-25T12:00:00.000Z',
    id: 'boost-1',
    isActive: false,
    listingId: 'listing-1',
    packageId: 'package-1',
    packageName: 'One week',
    paymentStatus: 'PENDING',
    placement: 'FOR_YOU',
    pricePaid: 1000,
    sellerId: 'seller-1',
    startsAt: '2026-10-18T11:00:00.000Z',
    updatedAt: '2026-10-18T11:45:00.000Z',
    ...overrides,
  } as ListingBoost;
}

function purchase(status: BoostPurchase['status'], boosts: ListingBoost[]) {
  return { boosts, status } as Pick<BoostPurchase, 'boosts' | 'status'>;
}

describe('deriveBoostPurchaseStatusSource', () => {
  const now = Date.parse('2026-10-18T12:00:00.000Z');

  it('derives the payment deadline from the earliest boost creation time', () => {
    const source = deriveBoostPurchaseStatusSource(
      purchase('PENDING_PAYMENT', [
        boost({ createdAt: '2026-10-18T11:50:00.000Z' }),
        boost({ id: 'boost-2', createdAt: '2026-10-18T11:45:00.000Z' }),
      ]),
      now,
    );

    expect(source.paymentDeadline).toBe(Date.parse('2026-10-18T12:15:00.000Z'));
  });

  it('reports no deadline, activity, or end for a purchase without boosts', () => {
    expect(deriveBoostPurchaseStatusSource(purchase('APPROVED', []), now)).toEqual({
      allBoostsEnded: false,
      campaignEndsAt: null,
      hasActiveBoost: false,
      paymentDeadline: null,
      status: 'APPROVED',
    });
  });

  it('reads the selected end date from a custom campaign boost and reports none for a package', () => {
    const campaign = deriveBoostPurchaseStatusSource(
      purchase('PENDING_PAYMENT', [boost({ packageId: null, endsAt: '2026-10-25T12:00:00.000Z' })]),
      now,
    );
    const package_ = deriveBoostPurchaseStatusSource(
      purchase('PENDING_PAYMENT', [boost({ packageId: 'package-1' })]),
      now,
    );

    expect(campaign.campaignEndsAt).toBe(Date.parse('2026-10-25T12:00:00.000Z'));
    expect(package_.campaignEndsAt).toBeNull();
  });

  it('reports an active boost only while paid and inside its window', () => {
    const paidNow = deriveBoostPurchaseStatusSource(
      purchase('APPROVED', [
        boost({ paymentStatus: 'PAID', startsAt: '2026-10-18T11:00:00.000Z' }),
      ]),
      now,
    );
    const unpaid = deriveBoostPurchaseStatusSource(
      purchase('APPROVED', [
        boost({ paymentStatus: 'PENDING', startsAt: '2026-10-18T11:00:00.000Z' }),
      ]),
      now,
    );

    expect(paidNow.hasActiveBoost).toBe(true);
    expect(unpaid.hasActiveBoost).toBe(false);
  });

  it('reports all boosts ended only once every end date has passed', () => {
    const ended = deriveBoostPurchaseStatusSource(
      purchase('APPROVED', [
        boost({ endsAt: '2026-10-17T11:00:00.000Z' }),
        boost({ id: 'boost-2', endsAt: '2026-10-17T12:00:00.000Z' }),
      ]),
      now,
    );
    const oneRunning = deriveBoostPurchaseStatusSource(
      purchase('APPROVED', [
        boost({ endsAt: '2026-10-17T11:00:00.000Z' }),
        boost({ id: 'boost-2', endsAt: '2026-10-25T12:00:00.000Z' }),
      ]),
      now,
    );

    expect(ended.allBoostsEnded).toBe(true);
    expect(oneRunning.allBoostsEnded).toBe(false);
  });

  it('shows a pending campaign whose selected end passed as ended through the status helpers', () => {
    const source = deriveBoostPurchaseStatusSource(
      purchase('PENDING_PAYMENT', [
        boost({
          createdAt: '2026-10-18T11:50:00.000Z',
          endsAt: '2026-10-18T11:55:00.000Z',
          packageId: null,
        }),
      ]),
      now,
    );

    expect(getBoostPurchaseDisplayStatus(source, now)).toBe('ENDED');
    expect(canStartBoostPayFastPayment(source, now)).toBe(false);
  });
});
