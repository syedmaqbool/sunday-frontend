import type { BoostPurchase, ListingBoost } from '@/types/boost.type';

type BoostActivationWindow = Pick<ListingBoost, 'endsAt' | 'paymentStatus' | 'startsAt'>;
type BoostPurchaseStatusSource = Pick<BoostPurchase, 'status'> & {
  boosts: BoostActivationWindow[];
};

export type BoostPurchaseDisplayStatus = 'ACTIVE' | BoostPurchase['status'];

export function isBoostPaidAndWithinActiveWindow(
  boost: BoostActivationWindow,
  now = Date.now(),
) {
  return boost.paymentStatus === 'PAID'
    && new Date(boost.startsAt).getTime() <= now
    && new Date(boost.endsAt).getTime() >= now;
}

export function getBoostPurchaseDisplayStatus(
  purchase: BoostPurchaseStatusSource,
  now = Date.now(),
): BoostPurchaseDisplayStatus {
  if (purchase.status !== 'APPROVED')
    return purchase.status;

  return purchase.boosts.some(boost => isBoostPaidAndWithinActiveWindow(boost, now))
    ? 'ACTIVE'
    : 'APPROVED';
}
