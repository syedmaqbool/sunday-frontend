import type { ApiRequestBody, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  CreateAdminTaxSettingData,
  GetAdminTaxSettingsResponses,
  GetTaxSettingsResponses,
  UpdateAdminTaxSettingData,
} from '@/types/generated-api';

export type TaxSetting = ApiResponseItem<GetAdminTaxSettingsResponses>;
export type CreateTaxSettingPayload = ApiRequestBody<CreateAdminTaxSettingData>;
export type UpdateTaxSettingPayload = ApiRequestBody<UpdateAdminTaxSettingData>;
export type ActiveTax = Omit<
  Pick<ApiResponseData<GetTaxSettingsResponses>, 'id' | 'name' | 'rate'>,
  'rate'
> & { rate: number };
