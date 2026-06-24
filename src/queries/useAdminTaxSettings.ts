import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTaxSetting,
  deleteTaxSetting,
  listTaxSettings,
  updateTaxSetting,
} from "@/services/taxSetting.service";
import type {
  CreateTaxSettingPayload,
  UpdateTaxSettingPayload,
} from "@/types/tax-setting";

export const taxSettingsQueryKey = {
  all: () => ["tax-settings"] as const,
  list: () => [...taxSettingsQueryKey.all(), "list"] as const,
};

export const getTaxSettingsOptions = () =>
  queryOptions({
    queryKey: taxSettingsQueryKey.list(),
    queryFn: async () => {
      const res = await listTaxSettings();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useTaxSettings = () => useQuery(getTaxSettingsOptions());

export const useCreateTaxSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaxSettingPayload) => createTaxSetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    },
  });
};

export const useUpdateTaxSetting = () => {
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
};

export const useDeleteTaxSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => deleteTaxSetting(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxSettingsQueryKey.all() });
    },
  });
};
