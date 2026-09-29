import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type { CreateAdminBrandData, GetBrandsResponses, UpdateAdminBrandData } from '@/types/generated-api';

export type Brand = ApiResponseItem<GetBrandsResponses>;
export type CreateBrandPayload = ApiRequestBody<CreateAdminBrandData>;
export type UpdateBrandPayload = ApiRequestBody<UpdateAdminBrandData>;
