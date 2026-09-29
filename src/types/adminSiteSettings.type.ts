import type { ApiRequestBody, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  GetAdminSiteSettingsResponses,
  UpdateAdminSiteSettingData,
  UploadFileResponses,
} from '@/types/generated-api';

type GeneratedSiteSetting = ApiResponseItem<GetAdminSiteSettingsResponses>;

export type SiteSetting<Value = GeneratedSiteSetting['value']> = Omit<GeneratedSiteSetting, 'value'> & { value: Value };
export type HeroImageValue = Extract<GeneratedSiteSetting['value'], { headlineLine1: string }>;
export type UploadedAsset = ApiResponseData<UploadFileResponses>;
export type UpdateAdminSiteSettingPayload = ApiRequestBody<UpdateAdminSiteSettingData>;
