import type { UserPreferences } from '@/types/buyer-preferences';
import { queryOptions } from '@tanstack/react-query';
import { getPreferences } from '@/services/buyer/preferences.service';

export type { UserPreferences } from '@/types/buyer-preferences';

export const userPreferencesQueryKey = {
  current: (userId?: string) => ['user-preferences', userId] as const,
};

export function getUserPreferencesOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<UserPreferences | null> => {
      try {
        const response = await getPreferences();
        return response.data;
      }
      catch {
        return null;
      }
    },
    queryKey: userPreferencesQueryKey.current(userId),
  });
}
