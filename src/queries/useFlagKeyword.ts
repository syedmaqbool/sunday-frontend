import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flagKeywordsService } from "@/services/flagkeyword.servie";

const FLAG_KEYWORDS_KEY = ["admin-flag-keywords"];

export const useFlagKeywords = () =>
  useQuery({
    queryKey: FLAG_KEYWORDS_KEY,
    queryFn: () => flagKeywordsService.getKeywords(),
    // data is string[] directly
  });

export const useUpdateFlagKeywords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keywords: string[]) => flagKeywordsService.updateKeywords(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLAG_KEYWORDS_KEY });
    },
  });
};