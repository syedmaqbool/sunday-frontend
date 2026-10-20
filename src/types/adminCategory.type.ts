import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateAdminCategoryData,
  CreateAdminClothingTypeData,
  CreateAdminSubcategoryData,
  GetAdminClothingTypesData,
  GetAdminCategoriesResponses,
  GetAdminClothingTypesResponses,
  GetAdminSubcategoriesResponses,
  UpdateAdminCategoryData,
  UpdateAdminClothingTypeData,
  UpdateAdminSubcategoryData,
} from '@/types/generated-api';

export type Category = ApiResponseItem<GetAdminCategoriesResponses>;
export type Subcategory = ApiResponseItem<GetAdminSubcategoriesResponses>;
export type ClothingType = ApiResponseItem<GetAdminClothingTypesResponses>;
export type CreateCategoryPayload = ApiRequestBody<CreateAdminCategoryData>;
export type CreateClothingTypePayload = ApiRequestBody<CreateAdminClothingTypeData>;
export type UpdateCategoryPayload = ApiRequestBody<UpdateAdminCategoryData>;
export type UpdateClothingTypePayload = ApiRequestBody<UpdateAdminClothingTypeData>;
export type ListClothingTypesQuery = ApiRequestQuery<GetAdminClothingTypesData>;
export type CreateSubcategoryPayload = ApiRequestBody<CreateAdminSubcategoryData>;
export type UpdateSubcategoryPayload = ApiRequestBody<UpdateAdminSubcategoryData>;
