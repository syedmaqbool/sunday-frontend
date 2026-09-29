import type { ApiRequestBody, ApiResponseData, ApiResponseItem } from './api.type';
import type { GetBrandsResponses, GetCategoriesResponses, GetMyPreferencesResponses, ReplaceMyPreferencesData } from '@/types/generated-api';

export type PreferenceBrand = ApiResponseItem<GetBrandsResponses>;
export type UserPreferences = ApiResponseData<GetMyPreferencesResponses>;
export type PutPreferencesPayload = ApiRequestBody<ReplaceMyPreferencesData>;
export type BackendCategory = ApiResponseItem<GetCategoriesResponses>;
