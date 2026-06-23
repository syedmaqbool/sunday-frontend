import { apiClient } from "@/lib/apiClient";
import { tokenStorage } from "@/lib/tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface HeroImageValue {
  url: string;
  mobileUrl: string;
  alt: string;
  badgeText: string;
  headlineLine1: string;
  headlineLine1Color: string;
  headlineLine2: string;
  headlineLine2Color: string;
  subtitle: string;
  subtitleColor: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface SiteSetting<T = Record<string, unknown>> {
  key: string;
  value: T;
}

export interface UploadedAsset {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

interface ItemResponse<T> {
  data: T;
}

const HERO_IMAGE_KEY = "hero_image";

export const siteSettingsService = {
  getHeroImage: () =>
    apiClient.get<ItemResponse<SiteSetting<HeroImageValue>>>(
      `/api/v1/admin/settings/site-settings/${HERO_IMAGE_KEY}`
    ),

  updateHeroImage: (value: Partial<HeroImageValue>) =>
    apiClient.patch<ItemResponse<SiteSetting<HeroImageValue>>>(
      `/api/v1/admin/settings/site-settings/${HERO_IMAGE_KEY}`,
      { value }
    ),

  uploadAsset: async (file: File): Promise<UploadedAsset> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = tokenStorage.getAccess();
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/settings/site-settings/assets`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `Upload failed: ${res.status}`);
    }

    const body: ItemResponse<UploadedAsset> = await res.json();
    return body.data;
  },
};