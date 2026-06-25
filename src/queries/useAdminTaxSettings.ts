import type {
  CreateTaxSettingPayload,
  UpdateTaxSettingPayload,
} from '@/types/tax-setting';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createTaxSetting,
  deleteTaxSetting,
  listTaxSettings,
  updateTaxSetting,
} from '@/services/taxSetting.service';

export const taxSettingsQueryKey = {
  all: () => ['tax-settings'] as const,
  list: () => [...taxSettingsQueryKey.all(), 'list'] as const,
};

export function getTaxSettingsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listTaxSettings();
      return response.data;
    },
    queryKey: taxSettingsQueryKey.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export const useTaxSettings = () => useQuery(getTaxSettingsOptions());

export function useCreateTaxSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaxSettingPayload) => createTaxSetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    },
  });
}

export function useUpdateTaxSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceId,
      payload,
    }: {
      resourceId: string;
      payload: UpdateTaxSettingPayload;
    }) => updateTaxSetting(resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    },
  });
}

export function useDeleteTaxSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => deleteTaxSetting(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    },
  });
}
