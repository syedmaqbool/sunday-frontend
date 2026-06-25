import type { HeroImageValue } from '@/types/admin/site-settings';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getHeroImage,
  updateHeroImage,
  uploadSiteAsset,
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

export const useHeroImage = () => useQuery(getHeroImageQueryOptions());

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

export function useUploadSiteAsset() {
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await uploadSiteAsset(file);
      return response.data;
    },
  });
}
