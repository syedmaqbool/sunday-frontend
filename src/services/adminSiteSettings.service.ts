import { authInstance } from "@/services/ky.instance";
import type {
  HeroImageValue,
  SiteSetting,
  UploadedAsset,
} from "@/types/admin/site-settings";
import type { Response } from "@/types/response.type";

const HERO_IMAGE_KEY = "hero_image";

export function getHeroImage() {
  return authInstance
    .get(`/api/v1/admin/settings/site-settings/${HERO_IMAGE_KEY}`)
    .json<Response<SiteSetting<HeroImageValue>>>();
}

export function updateHeroImage(value: Partial<HeroImageValue>) {
  return authInstance
    .patch(`/api/v1/admin/settings/site-settings/${HERO_IMAGE_KEY}`, {
      json: { value },
    })
    .json<Response<SiteSetting<HeroImageValue>>>();
}

export async function uploadSiteAsset(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return await authInstance
    .post("/api/v1/admin/settings/site-settings/assets", { body: formData })
    .json<Response<UploadedAsset>>();
}
