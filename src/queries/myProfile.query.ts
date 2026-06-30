import type {
  UpdateBankDetailsPayload,
  UpdateProfilePayload,
} from '@/types/profile.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyBankDetails,
  updateMyProfile,
  uploadProfileFile,
} from '@/services/profile.service';

export const myProfileQueryKey = {
  all: () => ['my-profile'] as const,
  details: () => [...myProfileQueryKey.all(), 'details'] as const,
};

export function getMyProfileQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getMyProfile();
      return response.data;
    },
    queryKey: myProfileQueryKey.details(),
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
}

export function useUpdateBankDetailsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBankDetailsPayload) =>
      updateMyBankDetails(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
}

export function useUploadProfileImageMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadProfileFile(file),
  });
}
