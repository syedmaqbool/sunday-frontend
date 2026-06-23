import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteSettingsService, type HeroImageValue } from "@/services/adminSiteSettings.service";

const HERO_IMAGE_KEY = ["site-settings", "hero_image"];

export const useHeroImage = () =>
  useQuery({
    queryKey: HERO_IMAGE_KEY,
    queryFn: async () => {
      try {
        const res = await siteSettingsService.getHeroImage();
        return res.data.value;
      } catch (e: any) {
        // 404 = setting not created yet, treat as empty
        if (e.message?.includes("404") || e.message?.toLowerCase().includes("not found")) {
          return null;
        }
        throw e;
      }
    },
  });

export const useUpdateHeroImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: Partial<HeroImageValue>) => siteSettingsService.updateHeroImage(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HERO_IMAGE_KEY });
    },
  });
};

export const useUploadSiteAsset = () =>
  useMutation({
    mutationFn: (file: File) => siteSettingsService.uploadAsset(file),
  });