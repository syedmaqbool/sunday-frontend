import type { ClothingType } from '@/types/clothing-type.type';
import type { PaginatedResponse } from '@/types/response.type';
import base, { API_BASE_URL } from '@/services/ky-base-instance';

const publicApi = base.extend({ baseUrl: API_BASE_URL });

export function listClothingTypes(page = 1, size = 100): Promise<PaginatedResponse<ClothingType>> {
  return publicApi
    .get('/api/v1/clothing-types', { searchParams: { page, size } })
    .json<PaginatedResponse<ClothingType>>();
}
