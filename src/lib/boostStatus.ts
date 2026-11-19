import type {
  BoostActivationWindow,
  BoostPurchaseDisplayStatus,
  BoostPurchaseStatusSource,
} from '@/types/boost.type';

// New unpaid boost purchases expire 30 minutes after they are created on the backend.
const BOOST_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export function isBoostPaidAndWithinActiveWindow(boost: BoostActivationWindow, now = Date.now()) {
  return (
    boost.paymentStatus === 'PAID' &&
    new Date(boost.startsAt).getTime() <= now &&
    new Date(boost.endsAt).getTime() >= now
  );
}

// The purchase response has no deadline field. Its boosts are written in the same transaction as
// the purchase, so the earliest boost creation time marks when the 30 minute window started.
export function getBoostPaymentDeadline(earliestBoostCreatedAt: number | null) {
  return earliestBoostCreatedAt === null ? null : earliestBoostCreatedAt + BOOST_PAYMENT_WINDOW_MS;
}

function hasCampaignEnded(purchase: BoostPurchaseStatusSource, now: number) {
  return purchase.campaignEndsAt !== null && purchase.campaignEndsAt <= now;
}

export function canStartBoostPayFastPayment(purchase: BoostPurchaseStatusSource, now = Date.now()) {
  return (
    purchase.status === 'PENDING_PAYMENT' &&
    purchase.paymentDeadline !== null &&
    purchase.paymentDeadline > now &&
    !hasCampaignEnded(purchase, now)
  );
}

export function getBoostPurchaseDisplayStatus(
  purchase: BoostPurchaseStatusSource,
  now = Date.now(),
): BoostPurchaseDisplayStatus {
  if (purchase.status === 'PENDING_PAYMENT') {
    if (hasCampaignEnded(purchase, now)) return 'ENDED';
    return canStartBoostPayFastPayment(purchase, now) ? 'PENDING_PAYMENT' : 'PAYMENT_EXPIRED';
  }
  if (purchase.status !== 'APPROVED') return purchase.status;
  if (purchase.hasActiveBoost) return 'ACTIVE';

  return purchase.allBoostsEnded ? 'ENDED' : 'APPROVED';
}
