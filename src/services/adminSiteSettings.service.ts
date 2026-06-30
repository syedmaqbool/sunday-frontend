import type {
  HeroImageValue,
  SiteSetting,
} from '@/types/adminSiteSettings.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

const HERO_IMAGE_KEY = 'hero_image';

export function getPublicHeroImage() {
  return authInstance
    .get(`/api/v1/site-settings/${HERO_IMAGE_KEY}`)
    .json<Response<SiteSetting<HeroImageValue>>>();
}

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
