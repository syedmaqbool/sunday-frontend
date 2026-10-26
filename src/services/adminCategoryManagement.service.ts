import type {
  Category,
  ClothingType,
  CreateCategoryPayload,
  CreateClothingTypePayload,
  CreateSubcategoryPayload,
  ListClothingTypesQuery,
  Subcategory,
  UpdateCategoryPayload,
  UpdateClothingTypePayload,
  UpdateSubcategoryPayload,
} from '@/types/adminCategory.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listCategories() {
  return authInstance
    .get('/api/v1/admin/categories')
    .json<PaginatedResponse<Category>>();
}

export function listClothingTypes(query: ListClothingTypesQuery) {
  return authInstance
    .get('/api/v1/admin/clothing-types', { searchParams: query })
    .json<PaginatedResponse<ClothingType>>();
}

export function createClothingType(payload: CreateClothingTypePayload) {
  return authInstance
    .post('/api/v1/admin/clothing-types', { json: payload })
    .json<Response<ClothingType>>();
}

export function updateClothingType(
  clothingTypeId: string,
  payload: UpdateClothingTypePayload,
) {
  return authInstance
    .patch(`/api/v1/admin/clothing-types/${clothingTypeId}`, { json: payload })
    .json<Response<ClothingType>>();
}

export function deleteClothingType(clothingTypeId: string) {
  return authInstance
    .delete(`/api/v1/admin/clothing-types/${clothingTypeId}`)
    .json<Response>();
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
