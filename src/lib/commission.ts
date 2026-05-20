export interface CommissionTier {
  id: string;
  name: string;
  categories: string[];
  min_price: number;
  max_price: number | null;
  rate: number;
  active: boolean;
  sort_order: number;
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
  tiers: CommissionTier[] | undefined | null,
  category: string | undefined | null,
  price: number,
): CommissionTier | null {
  if (!tiers || tiers.length === 0) return null;
  const cat = (category ?? "").toLowerCase();
  const tokens = new Set<string>();
  if (cat) {
    tokens.add(cat);
    for (const part of cat.split(/[-_/\s]+/)) if (part) tokens.add(part);
  }

  const inRange = (t: CommissionTier) =>
    t.active &&
    price >= Number(t.min_price ?? 0) &&
    (t.max_price == null || price <= Number(t.max_price));

  const matchesCategory = (t: CommissionTier) =>
    t.categories.length === 0 ||
    t.categories.some((c) => tokens.has(c.toLowerCase()));

  const inRangeTiers = tiers.filter(inRange);
  if (inRangeTiers.length === 0) return null;

  // Prefer category-specific match, then wildcard, then price-only fallback.
  const specific = inRangeTiers.filter((t) => t.categories.length > 0 && matchesCategory(t));
  const wildcard = inRangeTiers.filter((t) => t.categories.length === 0);
  const pool = specific.length ? specific : wildcard.length ? wildcard : inRangeTiers;

  return [...pool].sort((a, b) => {
    const minDiff = Number(b.min_price) - Number(a.min_price);
    if (minDiff !== 0) return minDiff;
    return b.sort_order - a.sort_order;
  })[0];
}

export function calcCommission(
  tiers: CommissionTier[] | undefined | null,
  category: string | undefined | null,
  price: number,
  quantity = 1,
): { tier: CommissionTier | null; rate: number; amount: number } {
  const tier = resolveTier(tiers, category, price);
  const rate = tier ? Number(tier.rate) : 0;
  const amount = Math.round(((price * quantity * rate) / 100) * 100) / 100;
  return { tier, rate, amount };
}
