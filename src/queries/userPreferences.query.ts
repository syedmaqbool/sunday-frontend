import type { UserPreferences } from '@/types/buyerPreferences.type';
import { queryOptions } from '@tanstack/react-query';
import { getPreferences } from '@/services/buyerPreferences.service';

export type { UserPreferences } from '@/types/buyerPreferences.type';

export const userPreferencesQueryKey = {
  all: () => ['user-preferences'] as const,
  current: (userId?: string) =>
    [...userPreferencesQueryKey.all(), 'current', userId ?? null] as const,
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
