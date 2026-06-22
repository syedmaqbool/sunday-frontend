import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageModerationService } from "@/services/messageModeration.service";

const FLAGGED_KEY = ["admin-flagged-messages"];

export const useFlaggedMessages = () =>
  useQuery({
    queryKey: FLAGGED_KEY,
    queryFn: async () => {
      const res = await messageModerationService.listFlagged({ size: 100 });
      return res.data;
    },
  });

export const useDismissFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messageModerationService.dismiss(messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: FLAGGED_KEY }),
  });
};

export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messageModerationService.delete(messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: FLAGGED_KEY }),
  });
};