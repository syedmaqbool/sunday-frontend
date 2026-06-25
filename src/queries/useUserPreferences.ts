import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  brands: string[] | null;
  budget_max: number | null;
  budget_min: number | null;
  onboarding_completed: boolean | null;
  preferred_fit: string | null;
  styles: string[] | null;
}

export const userPreferencesQueryKey = {
  current: (userId?: string) => ['user-preferences', userId] as const,
};

export function getUserPreferencesOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId)
        return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select(
          'styles, brands, preferred_fit, budget_min, budget_max, onboarding_completed',
        )
        .eq('user_id', userId)
        .maybeSingle();
      if (error)
        throw error;
      return data;
    },
    queryKey: userPreferencesQueryKey.current(userId),
  });
}
