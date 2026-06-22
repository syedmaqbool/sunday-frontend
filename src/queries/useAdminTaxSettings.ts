
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  taxSettingService,
  type CreateTaxSettingPayload,
  type UpdateTaxSettingPayload,
} from "@/services/taxSetting.service";

const TAX_SETTINGS_KEY = ["tax-settings"];

export const useTaxSettings = () =>
  useQuery({
    queryKey: TAX_SETTINGS_KEY,
    queryFn: async () => {
      const res = await taxSettingService.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateTaxSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaxSettingPayload) =>
      taxSettingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_SETTINGS_KEY });
    },
  });
};

export const useUpdateTaxSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, payload }: { resourceId: string; payload: UpdateTaxSettingPayload }) =>
      taxSettingService.update(resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_SETTINGS_KEY });
    },
  });
};

export const useDeleteTaxSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) =>
      taxSettingService.delete(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_SETTINGS_KEY });
    },
  });
};