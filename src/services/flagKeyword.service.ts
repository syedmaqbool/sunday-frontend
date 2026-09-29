import type {
  AdminSettings,
  AdminSettingsUpdatePayload,
  UpdateFlagKeywordsPayload,
} from '@/types/adminSettings.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export async function getFlagKeywords() {
  return await authInstance
    .get('/api/v1/admin/settings')
    .json<Response<AdminSettings>>();
}

export function updateFlagKeywords(keywords: UpdateFlagKeywordsPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { flagKeywords: keywords } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}
