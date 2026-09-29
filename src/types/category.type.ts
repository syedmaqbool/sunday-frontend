import type { ApiResponseItem } from './api.type';
import type { GetCategoriesResponses, GetSubcategoriesResponses } from '@/types/generated-api';

export type Category = ApiResponseItem<GetCategoriesResponses>;
export type Subcategory = ApiResponseItem<GetSubcategoriesResponses>;
