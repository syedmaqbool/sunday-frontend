import type { UserPreferences } from '@/queries/useUserPreferences';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserPreferencesOptions,

} from '@/queries/useUserPreferences';

export function useUserPreferences() {
  const { user } = useAuth();
  return useQuery(getUserPreferencesOptions(user?.id));
}

/**
 * Sort listings so that items matching user preferences appear first.
 * Score: +2 for matching brand, +1 for matching style/category.
 * Items within budget range get +1.
 */
export function personalizeListings<
  T extends { brand: string; price: number },
>(
  listings: T[],
  preferences: UserPreferences | null | undefined,
  getStyleValue: (item: T) => string = item => (item as T & { category: string }).category,
): T[] {
  if (!preferences)
    return listings;

  const prefBrands = new Set((preferences.brands ?? []).map(b => b.toLowerCase()));
  const prefStyles = new Set((preferences.styles ?? []).map(s => s.toLowerCase()));

  const scored = listings.map((item) => {
    let score = 0;
    if (prefBrands.has(item.brand.toLowerCase()))
      score += 2;
    if (prefStyles.has(getStyleValue(item).toLowerCase()))
      score += 1;
    if (preferences.budget_min != null && preferences.budget_max != null && item.price >= preferences.budget_min && item.price <= preferences.budget_max)
      score += 1;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}
