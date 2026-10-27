import { calcCommission } from '@/lib/commission';
import type { CommissionTier } from '@/lib/commission';

export function calculatePriceWithFee(
  tiers: CommissionTier[] | null | undefined,
  category: string | null | undefined,
  price: number,
) {
  const { amount, rate } = calcCommission(tiers, category, price);

  return { amount, rate, total: price + amount };
}
