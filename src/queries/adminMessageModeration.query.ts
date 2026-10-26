import type { InfiniteData } from '@tanstack/react-query';
import type {
  FlaggedConversationResponse,
  ResolvedFlaggedConversationResponse,
} from '@/types/adminMessageModeration.type';
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMessage,
  dismissFlaggedMessage,
  getFlaggedConversation,
  getResolvedFlaggedConversation,
  listFlaggedMessageHistory,
  listFlaggedMessages,
} from '@/services/messageModeration.service';

export const messageModerationQueryKey = {
  all: () => ['admin-flagged-messages'] as const,
  conversation: (messageId: string | null) =>
    [...messageModerationQueryKey.all(), 'conversation', 'detail', messageId] as const,
  flagged: () => [...messageModerationQueryKey.all(), 'list'] as const,
  history: () => [...messageModerationQueryKey.all(), 'history'] as const,
  historyConversation: (historyId: string | null) =>
    [...messageModerationQueryKey.history(), 'conversation', 'detail', historyId] as const,
  historyList: () => [...messageModerationQueryKey.history(), 'list'] as const,
};

export function getFlaggedMessagesOptions() {
  return queryOptions({
    queryFn: async () => await listFlaggedMessages({ size: 100 }),
    queryKey: messageModerationQueryKey.flagged(),
  });
}

export function getFlaggedMessageHistoryOptions(enabled = true) {
  return infiniteQueryOptions({
    enabled,
    getNextPageParam: (lastPage: Awaited<ReturnType<typeof listFlaggedMessageHistory>>) =>
      lastPage.pagination.nextPage ?? undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => await listFlaggedMessageHistory({ page: pageParam, size: 20 }),
    queryKey: messageModerationQueryKey.historyList(),
  });
}

export function getResolvedFlaggedConversationOptions(historyId?: string) {
  return infiniteQueryOptions<
    ResolvedFlaggedConversationResponse,
    Error,
    InfiniteData<ResolvedFlaggedConversationResponse, number>,
    ReturnType<typeof messageModerationQueryKey.historyConversation>,
    number
  >({
    enabled: Boolean(historyId),
    getNextPageParam: lastPage => lastPage.pagination.nextPage ?? undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => await getResolvedFlaggedConversation(historyId!, {
      page: pageParam,
      size: 50,
    }),
    queryKey: messageModerationQueryKey.historyConversation(historyId ?? null),
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
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.historyList() }),
    ]),
  });
}

export function useDeleteMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.flagged() }),
      qc.invalidateQueries({ queryKey: messageModerationQueryKey.historyList() }),
    ]),
  });
}
