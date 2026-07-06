import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMessage,
  dismissFlaggedMessage,
  listFlaggedMessages,
} from '@/services/messageModeration.service';

export const messageModerationQueryKey = {
  all: () => ['admin-flagged-messages'] as const,
  flagged: () => [...messageModerationQueryKey.all(), 'list'] as const,
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

export function useDismissFlagMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => dismissFlaggedMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
}

export function useDeleteMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
  });
}
