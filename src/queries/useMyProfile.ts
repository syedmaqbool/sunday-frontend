import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getMyProfile,
  updateMyBankDetails,
  updateMyProfile,
  uploadProfileFile,
} from "@/services/profile.service";
import type {
  UpdateBankDetailsPayload,
  UpdateProfilePayload,
} from "@/types/profile";

export const myProfileQueryKey = {
  all: () => ["my-profile"] as const,
  details: () => [...myProfileQueryKey.all(), "details"] as const,
};

export const getMyProfileQueryOptions = () =>
  queryOptions({
    queryKey: myProfileQueryKey.details(),
    queryFn: async () => {
      const res = await getMyProfile();
      return res.data;
    },
  });

export const useMyProfile = () => useQuery(getMyProfileQueryOptions());

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
};

export const useUpdateBankDetails = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBankDetailsPayload) =>
      updateMyBankDetails(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: myProfileQueryKey.all() }),
  });
};

export const useUploadProfileImage = () =>
  useMutation({
    mutationFn: (file: File) => uploadProfileFile(file),
  });
