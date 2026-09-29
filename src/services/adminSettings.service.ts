import type {
  AdminSettings,
  AdminSettingsUpdatePayload,
  UpdateBoostPackagesPayload,
  UpdateEmailTemplatesPayload,
  UpdateHelpCategoriesPayload,
  UpdateHelpFaqsPayload,
} from '@/types/adminSettings.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminSettings() {
  return authInstance
    .get('/api/v1/admin/settings')
    .json<Response<AdminSettings>>();
}

export function updateAdminBoostPackages(boostPackages: UpdateBoostPackagesPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { boostPackages } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}

export function updateHelpCategories(helpCategories: UpdateHelpCategoriesPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { helpCategories } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}

export function updateHelpFaqs(helpFaqs: UpdateHelpFaqsPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { helpFaqs } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}

export function updateEmailTemplates(emailTemplates: UpdateEmailTemplatesPayload) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { emailTemplates } satisfies AdminSettingsUpdatePayload })
    .json<Response<AdminSettings>>();
}
