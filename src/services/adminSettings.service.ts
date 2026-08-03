import type {
  AdminSettings,
  EmailTemplateAPI,
  HelpCategoryAPI,
  HelpFaqAPI,
} from '@/types/adminSettings.type';
import type { BoostPackageAPI } from '@/types/boost.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getAdminSettings() {
  return authInstance
    .get('/api/v1/admin/settings')
    .json<Response<AdminSettings>>();
}

export function updateAdminBoostPackages(boostPackages: BoostPackageAPI[]) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { boostPackages } })
    .json<Response<AdminSettings>>();
}

export function updateHelpCategories(helpCategories: HelpCategoryAPI[]) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { helpCategories } })
    .json<Response<AdminSettings>>();
}

export function updateHelpFaqs(helpFaqs: HelpFaqAPI[]) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { helpFaqs } })
    .json<Response<AdminSettings>>();
}

export function updateEmailTemplates(emailTemplates: EmailTemplateAPI[]) {
  return authInstance
    .patch('/api/v1/admin/settings', { json: { emailTemplates } })
    .json<Response<AdminSettings>>();
}
