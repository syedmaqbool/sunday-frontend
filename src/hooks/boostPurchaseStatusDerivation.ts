import type { BoostPurchase, BoostPurchaseStatusSource } from '@/types/boost.type';

import { getBoostPaymentDeadline, isBoostPaidAndWithinActiveWindow } from '@/lib/boostStatus';

// Reduces a purchase's boosts to the scalars the status helpers read, evaluated at `now`.
export function deriveBoostPurchaseStatusSource(
  purchase: Pick<BoostPurchase, 'boosts' | 'status'>,
  now: number,
): BoostPurchaseStatusSource {
  const earliestCreatedAt =
    purchase.boosts.length === 0
      ? null
      : Math.min(...purchase.boosts.map(boost => Date.parse(boost.createdAt)));
  const campaignBoost = purchase.boosts.find(boost => boost.packageId === null);

  return {
    allBoostsEnded:
      purchase.boosts.length > 0 &&
      purchase.boosts.every(boost => new Date(boost.endsAt).getTime() < now),
    campaignEndsAt: campaignBoost ? Date.parse(campaignBoost.endsAt) : null,
    hasActiveBoost: purchase.boosts.some(boost => isBoostPaidAndWithinActiveWindow(boost, now)),
    paymentDeadline: getBoostPaymentDeadline(earliestCreatedAt),
    status: purchase.status,
  };
}
