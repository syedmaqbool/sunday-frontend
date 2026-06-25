import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserPreferencesOptions,
  type UserPreferences,
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
  T extends { brand: string; category: string; price: number },
>(listings: T[], prefs: UserPreferences | null | undefined): T[] {
  if (!prefs)
    return listings;

  const prefBrands = new Set((prefs.brands ?? []).map(b => b.toLowerCase()));
  const prefStyles = new Set((prefs.styles ?? []).map(s => s.toLowerCase()));

  const scored = listings.map((item) => {
    let score = 0;
    if (prefBrands.has(item.brand.toLowerCase()))
      score += 2;
    if (prefStyles.has(item.category.toLowerCase()))
      score += 1;
    if (prefs.budget_min != null && prefs.budget_max != null && item.price >= prefs.budget_min && item.price <= prefs.budget_max)
      score += 1;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}
