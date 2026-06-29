import type { HeroImageValue } from '@/types/admin/site-settings';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { uploadFile } from '@/lib/uploadFile';
import {
  getHeroImage,
  getPublicHeroImage,
  updateHeroImage,
} from '@/services/adminSiteSettings.service';

export const siteSettingsQueryKey = {
  all: () => ['site-settings'] as const,
  heroImage: () => [...siteSettingsQueryKey.all(), 'hero_image'] as const,
};

export function getHeroImageQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      try {
        const response = await getHeroImage();
        return response.data.value;
      }
      catch (error: any) {
        // 404 = setting not created yet, treat as empty
        if (
          error.message?.includes('404')
          || error.message?.toLowerCase().includes('not found')
        ) {
          return null;
        }
        throw error;
      }
    },
    queryKey: siteSettingsQueryKey.heroImage(),
  });
}

export function getPublicHeroImageOptions() {
  return queryOptions({
    queryFn: async () => {
      try {
        const response = await getPublicHeroImage();
        return response.data.value;
      }
      catch {
        return null;
      }
    },
    queryKey: siteSettingsQueryKey.heroImage(),
    staleTime: 60_000,
  });
}

export function useUpdateHeroImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: Partial<HeroImageValue>) => updateHeroImage(value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: siteSettingsQueryKey.heroImage(),
      });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await uploadFile(file);
      return response.data;
    },
  });
}
