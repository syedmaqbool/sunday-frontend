import type {
  CreateHelpTutorialPayload,
  UpdateHelpTutorialPayload,
} from '@/types/helpTutorial.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdminHelpTutorial,
  deleteAdminHelpTutorial,
  getHelpTutorials,
  listAdminHelpTutorials,
  updateAdminHelpTutorial,
} from '@/services/helpTutorial.service';

export const helpTutorialQueryKey = {
  adminAll: () => ['admin-help-tutorials'] as const,
  adminList: (params: { page?: number; size?: number }) =>
    [...helpTutorialQueryKey.adminAll(), 'list', params] as const,
  all: () => ['help-tutorials'] as const,
  list: () => [...helpTutorialQueryKey.all(), 'list'] as const,
};

export function getHelpTutorialsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getHelpTutorials();
      return response.data;
    },
    queryKey: helpTutorialQueryKey.list(),
  });
}

export function getAdminHelpTutorialsOptions(params: { page?: number; size?: number }) {
  return queryOptions({
    queryFn: () => listAdminHelpTutorials(params),
    queryKey: helpTutorialQueryKey.adminList(params),
  });
}

export function useCreateHelpTutorialMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHelpTutorialPayload) =>
      createAdminHelpTutorial(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: helpTutorialQueryKey.adminAll() }),
  });
}

export function useUpdateHelpTutorialMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateHelpTutorialPayload;
    }) => updateAdminHelpTutorial(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: helpTutorialQueryKey.adminAll() }),
  });
}

export function useDeleteHelpTutorialMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminHelpTutorial(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: helpTutorialQueryKey.adminAll() }),
  });
}
