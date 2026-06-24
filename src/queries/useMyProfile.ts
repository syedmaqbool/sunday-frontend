import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  profileService,
  type UpdateProfilePayload,
  type UpdateBankDetailsPayload,
} from "@/services/profile.service";

const PROFILE_KEY = ["my-profile"];

export const useMyProfile = () =>
  useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const res = await profileService.getMe();
      return res.data;
    },
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.updateMe(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useUpdateBankDetails = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBankDetailsPayload) => profileService.updateBankDetails(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
};

export const useUploadProfileImage = () =>
  useMutation({
    mutationFn: (file: File) => profileService.uploadFile(file),
  });