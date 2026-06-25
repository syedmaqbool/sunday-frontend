import type {
  UpdateBankDetailsPayload,
  UpdateProfilePayload,
} from '@/types/profile';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

export const useMyProfile = () => useQuery(getMyProfileQueryOptions());

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
}

export function useUpdateBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBankDetailsPayload) =>
      updateMyBankDetails(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
}

export function useUploadProfileImage() {
  return useMutation({
    mutationFn: (file: File) => uploadProfileFile(file),
  });
}
