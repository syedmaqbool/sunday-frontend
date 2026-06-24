import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getHeroImage,
  updateHeroImage,
  uploadSiteAsset,
} from "@/services/adminSiteSettings.service";
import type { HeroImageValue } from "@/types/admin/site-settings";

export const siteSettingsQueryKey = {
  all: () => ["site-settings"] as const,
  heroImage: () => [...siteSettingsQueryKey.all(), "hero_image"] as const,
};

export const getHeroImageQueryOptions = () =>
  queryOptions({
    queryKey: siteSettingsQueryKey.heroImage(),
    queryFn: async () => {
      try {
        const res = await getHeroImage();
        return res.data.value;
      } catch (e: any) {
        // 404 = setting not created yet, treat as empty
        if (
          e.message?.includes("404") ||
          e.message?.toLowerCase().includes("not found")
        ) {
          return null;
        }
        throw e;
      }
    },
  });

export const useHeroImage = () => useQuery(getHeroImageQueryOptions());

export const useUpdateHeroImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: Partial<HeroImageValue>) => updateHeroImage(value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: siteSettingsQueryKey.heroImage(),
      });
    },
  });
};

export const useUploadSiteAsset = () =>
  useMutation({
    mutationFn: (file: File) => uploadSiteAsset(file),
  });
