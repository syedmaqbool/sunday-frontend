import type { AdminSettings } from '@/types/adminSettings.type';
import type { BoostPackage, ListingBoost } from '@/types/boost.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export async function getBoostPackages() {
  return authInstance
    .get('/api/v1/admin/settings')
    .json<Response<AdminSettings>>();
}

export function updateBoostPackages(packages: BoostPackage[]) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { boostPackages: packages } })
    .json<Response<AdminSettings>>();
}

export function listBoosts(parameters: { page?: number; size?: number } = {}) {
  return authInstance
    .get('/api/v1/admin/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}
