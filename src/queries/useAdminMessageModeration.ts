import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deleteMessage,
  dismissFlaggedMessage,
  listFlaggedMessages,
} from '@/services/messageModeration.service';

export const messageModerationQueryKey = {
  flagged: () => ['admin-flagged-messages'] as const,
};

export function getFlaggedMessagesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listFlaggedMessages({ size: 100 });
      return response.data;
    },
    queryKey: messageModerationQueryKey.flagged(),
  });
}

export const useFlaggedMessages = () => useQuery(getFlaggedMessagesOptions());

export function useDismissFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => dismissFlaggedMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
}
