import type { InfiniteData } from '@tanstack/react-query';
import type { FlaggedConversationResponse } from '@/types/adminMessageModeration.type';
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMessage,
  dismissFlaggedMessage,
  getFlaggedConversation,
  listFlaggedMessages,
} from '@/services/messageModeration.service';

export const messageModerationQueryKey = {
  all: () => ['admin-flagged-messages'] as const,
  conversation: (messageId: string | null) =>
    [...messageModerationQueryKey.all(), 'conversation', 'detail', messageId] as const,
  flagged: () => [...messageModerationQueryKey.all(), 'list'] as const,
};

export function getFlaggedMessagesOptions() {
  return queryOptions({
    queryFn: async () => await listFlaggedMessages({ size: 100 }),
    queryKey: messageModerationQueryKey.flagged(),
  });
}

export function getFlaggedConversationOptions(messageId?: string) {
  return infiniteQueryOptions<
    FlaggedConversationResponse,
    Error,
    InfiniteData<FlaggedConversationResponse, number>,
    ReturnType<typeof messageModerationQueryKey.conversation>,
    number
  >({
    enabled: Boolean(messageId),
    getNextPageParam: lastPage => lastPage.pagination.nextPage ?? undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => await getFlaggedConversation(messageId!, {
      page: pageParam,
      size: 50,
    }),
    queryKey: messageModerationQueryKey.conversation(messageId ?? null),
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
