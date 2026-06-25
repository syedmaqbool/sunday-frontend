import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getFlagKeywords,
  updateFlagKeywords,
} from '@/services/flagkeyword.servie';

export const flagKeywordsQueryKey = {
  all: () => ['admin-flag-keywords'] as const,
};

export function getFlagKeywordsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getFlagKeywords();
      return response.data.flagKeywords ?? [];
    },
    queryKey: flagKeywordsQueryKey.all(),
  });
}

export function useUpdateFlagKeywords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keywords: string[]) => updateFlagKeywords(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagKeywordsQueryKey.all() });
    },
  });
}
