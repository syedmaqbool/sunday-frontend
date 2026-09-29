import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  CreateAdminCategoryData,
  CreateAdminSubcategoryData,
  GetAdminCategoriesResponses,
  GetAdminSubcategoriesResponses,
  UpdateAdminCategoryData,
  UpdateAdminSubcategoryData,
} from '@/types/generated-api';

export type Category = ApiResponseItem<GetAdminCategoriesResponses>;
export type Subcategory = ApiResponseItem<GetAdminSubcategoriesResponses>;
export type CreateCategoryPayload = ApiRequestBody<CreateAdminCategoryData>;
export type UpdateCategoryPayload = ApiRequestBody<UpdateAdminCategoryData>;
export type CreateSubcategoryPayload = ApiRequestBody<CreateAdminSubcategoryData>;
export type UpdateSubcategoryPayload = ApiRequestBody<UpdateAdminSubcategoryData>;
