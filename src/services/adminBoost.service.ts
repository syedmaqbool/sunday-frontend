import type { AdminSettings, AdminSettingsUpdatePayload, UpdateBoostPackagesPayload } from '@/types/adminSettings.type';
import type { AdminBoostListParameters, ListingBoost } from '@/types/boost.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export async function getBoostPackages() {
  return authInstance
    .get('/api/v1/admin/settings')
    .json<Response<AdminSettings>>();
}

export function updateBoostPackages(packages: UpdateBoostPackagesPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { boostPackages: packages } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}

export function listBoosts(parameters: AdminBoostListParameters = {}) {
  return authInstance
    .get('/api/v1/admin/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}
