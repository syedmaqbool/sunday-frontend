import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getFlagKeywords,
  updateFlagKeywords,
} from "@/services/flagkeyword.servie";

export const flagKeywordsQueryKey = {
  all: () => ["admin-flag-keywords"] as const,
};

export const getFlagKeywordsOptions = () =>
  queryOptions({
    queryKey: flagKeywordsQueryKey.all(),
    queryFn: () => getFlagKeywords(),
    // data is string[] directly
  });

export const useFlagKeywords = () => useQuery(getFlagKeywordsOptions());

export const useUpdateFlagKeywords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keywords: string[]) => updateFlagKeywords(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagKeywordsQueryKey.all() });
    },
  });
};
