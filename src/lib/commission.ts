export interface CommissionTier {
  id: string;
  active: boolean;
  categories: string[];
  maxPrice: number | null;
  minPrice: number;
  name: string;
  rate: number;
  sortOrder: number;
}

/**
 * Resolve the best-matching active commission tier for a listing.
 * Match priority:
 *  1. Tier whose categories array contains a token derived from listing.category AND price in range.
 *  2. Tier with empty categories (wildcard) AND price in range.
 *  3. Otherwise null.
 * When multiple tiers match, the one with the highest min_price wins, then highest sort_order.
 */
export function resolveTier(
  tiers: CommissionTier[] | null | undefined,
  category: string | null | undefined,
  price: number,
): CommissionTier | null {
  if (!tiers || tiers.length === 0)
    return null;
  const cat = (category ?? '').toLowerCase();
  const tokens = new Set<string>();
  if (cat) {
    tokens.add(cat);
    for (const part of cat.split(/[-_/\s]+/)) {
      if (part)
        tokens.add(part);
    }
  }

  const inRange = (t: CommissionTier) =>
    t.active
    && price >= Number(t.minPrice ?? 0)
    && (t.maxPrice == null || price <= Number(t.maxPrice));

  const matchesCategory = (t: CommissionTier) =>
    t.categories.length === 0
    || t.categories.some(c => tokens.has(c.toLowerCase()));

  const inRangeTiers = tiers.filter(t => inRange(t));
  if (inRangeTiers.length === 0)
    return null;

  // Prefer category-specific match, then wildcard, then price-only fallback.
  const specific = inRangeTiers.filter(t => t.categories.length > 0 && matchesCategory(t));
  const wildcard = inRangeTiers.filter(t => t.categories.length === 0);
  const pool = specific.length > 0 ? specific : (wildcard.length > 0 ? wildcard : inRangeTiers);

  return pool.toSorted((a, b) => {
    const minDiff = Number(b.minPrice) - Number(a.minPrice);
    if (minDiff !== 0)
      return minDiff;
    return b.sortOrder - a.sortOrder;
  })[0];
}

export function calcCommission(
  tiers: CommissionTier[] | null | undefined,
  category: string | null | undefined,
  price: number,
  quantity = 1,
): { amount: number; rate: number; tier: CommissionTier | null } {
  const tier = resolveTier(tiers, category, price);
  const rate = tier ? Number(tier.rate) : 0;
  const amount = Math.round(((price * quantity * rate) / 100) * 100) / 100;
  return { amount, rate, tier };
}
