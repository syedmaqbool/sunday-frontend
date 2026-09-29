import type { ApiRequestBody, ApiResponseData } from './api.type';
import type { GetAdminSettingsResponses, UpdateAdminSettingsData } from '@/types/generated-api';

export type AdminSettings = ApiResponseData<GetAdminSettingsResponses>;
export type HelpCategoryAPI = AdminSettings['helpCategories'][number];
export type HelpFaqAPI = AdminSettings['helpFaqs'][number];
export type EmailTemplateAPI = AdminSettings['emailTemplates'][number];
export type AdminSettingsUpdatePayload = ApiRequestBody<UpdateAdminSettingsData>;
export type UpdateBoostPackagesPayload = NonNullable<AdminSettingsUpdatePayload['boostPackages']>;
export type UpdateHelpCategoriesPayload = NonNullable<AdminSettingsUpdatePayload['helpCategories']>;
export type UpdateHelpFaqsPayload = NonNullable<AdminSettingsUpdatePayload['helpFaqs']>;
export type UpdateEmailTemplatesPayload = NonNullable<AdminSettingsUpdatePayload['emailTemplates']>;
export type UpdateFlagKeywordsPayload = NonNullable<AdminSettingsUpdatePayload['flagKeywords']>;
