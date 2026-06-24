import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPreferences {
  styles: string[] | null;
  brands: string[] | null;
  preferred_fit: string | null;
  budget_min: number | null;
  budget_max: number | null;
  onboarding_completed: boolean | null;
}

export const useUserPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_preferences")
        .select(
          "styles, brands, preferred_fit, budget_min, budget_max, onboarding_completed",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

/**
 * Sort listings so that items matching user preferences appear first.
 * Score: +2 for matching brand, +1 for matching style/category.
 * Items within budget range get +1.
 */
export const personalizeListings = <
  T extends { brand: string; category: string; price: number },
>(
  listings: T[],
  prefs: UserPreferences | null | undefined,
): T[] => {
  if (!prefs) return listings;

  const prefBrands = new Set((prefs.brands ?? []).map((b) => b.toLowerCase()));
  const prefStyles = new Set((prefs.styles ?? []).map((s) => s.toLowerCase()));

  const scored = listings.map((item) => {
    let score = 0;
    if (prefBrands.has(item.brand.toLowerCase())) score += 2;
    if (prefStyles.has(item.category.toLowerCase())) score += 1;
    if (prefs.budget_min != null && prefs.budget_max != null) {
      if (item.price >= prefs.budget_min && item.price <= prefs.budget_max)
        score += 1;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
};
