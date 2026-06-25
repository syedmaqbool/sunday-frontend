import type {
  BackendCategory,
  PreferenceBrand,
  PutPreferencesPayload,
  UserPreferences,
} from '@/types/buyer-preferences';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getPreferences() {
  return authInstance
    .get('/api/v1/preferences/me')
    .json<Response<UserPreferences>>();
}

export function putPreferences(payload: PutPreferencesPayload) {
  return authInstance
    .put('/api/v1/preferences/me', { json: payload })
    .json<Response>();
}

export function getCategories() {
  return authInstance
    .get('/api/v1/categories')
    .json<Response<BackendCategory[]>>();
}

export function getSubcategories() {
  return authInstance
    .get('/api/v1/subcategories')
    .json<PaginatedResponse<BackendCategory>>();
}

export function getBrands() {
  return authInstance
    .get('/api/v1/brands')
    .json<PaginatedResponse<PreferenceBrand>>();
}
