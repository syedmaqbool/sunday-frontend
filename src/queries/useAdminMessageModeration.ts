import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteMessage,
  dismissFlaggedMessage,
  listFlaggedMessages,
} from "@/services/messageModeration.service";

export const messageModerationQueryKey = {
  flagged: () => ["admin-flagged-messages"] as const,
};

export const getFlaggedMessagesOptions = () =>
  queryOptions({
    queryKey: messageModerationQueryKey.flagged(),
    queryFn: async () => {
      const res = await listFlaggedMessages({ size: 100 });
      return res.data;
    },
  });

export const useFlaggedMessages = () => useQuery(getFlaggedMessagesOptions());

export const useDismissFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => dismissFlaggedMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
};

export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
};
