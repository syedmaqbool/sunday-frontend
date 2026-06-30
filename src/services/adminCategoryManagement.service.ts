import type {
  Category,
  CreateCategoryPayload,
  CreateSubcategoryPayload,
  Subcategory,
  UpdateCategoryPayload,
  UpdateSubcategoryPayload,
} from '@/types/adminCategory.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listCategories() {
  return authInstance
    .get('/api/v1/admin/categories')
    .json<PaginatedResponse<Category>>();
}

export function createCategory(payload: CreateCategoryPayload) {
  return authInstance
    .post('/api/v1/admin/categories', { json: payload })
    .json<Response<Category>>();
}

export function updateCategory(
  categoryId: string,
  payload: UpdateCategoryPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/categories/${categoryId}`, { json: payload })
    .json<Response<Category>>();
}

export function deleteCategory(categoryId: string) {
  return authInstance
    .delete(`/api/v1/admin/categories/${categoryId}`)
    .json<Response>();
}

export function listSubcategories() {
  return authInstance
    .get('/api/v1/admin/subcategories')
    .json<PaginatedResponse<Subcategory>>();
}

export function createSubcategory(payload: CreateSubcategoryPayload) {
  return authInstance
    .post('/api/v1/admin/subcategories', { json: payload })
    .json<Response<Subcategory>>();
}

export function updateSubcategory(
  subcategoryId: string,
  payload: UpdateSubcategoryPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/subcategories/${subcategoryId}`, { json: payload })
    .json<Response<Subcategory>>();
}

export function deleteSubcategory(subcategoryId: string) {
  return authInstance
    .delete(`/api/v1/admin/subcategories/${subcategoryId}`)
    .json<Response>();
}
