import type {
  EmailTemplateAPI,
  HelpCategoryAPI,
  HelpFaqAPI,
  HelpTutorialAPI,
} from '@/types/admin/settings';
import type { BoostPackageAPI } from '@/types/boost';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getAdminSettings,
  updateAdminBoostPackages,
  updateEmailTemplates,
  updateHelpCategories,
  updateHelpFaqs,
  updateHelpTutorials,
} from '@/services/adminSettings.service';

export const adminSettingsQueryKey = {
  all: () => ['admin-settings'] as const,
  details: () => [...adminSettingsQueryKey.all(), 'details'] as const,
};

export function getAdminSettingsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getAdminSettings();
      return response.data;
    },
    queryKey: adminSettingsQueryKey.details(),
  });
}

export function useUpdateBoostPackages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boostPackages: BoostPackageAPI[]) =>
      updateAdminBoostPackages(boostPackages),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() });
    },
  });
}

export function useUpdateHelpCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpCategories: HelpCategoryAPI[]) =>
      updateHelpCategories(helpCategories),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateHelpFaqs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpFaqs: HelpFaqAPI[]) => updateHelpFaqs(helpFaqs),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateHelpTutorials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpTutorials: HelpTutorialAPI[]) =>
      updateHelpTutorials(helpTutorials),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateEmailTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailTemplates: EmailTemplateAPI[]) =>
      updateEmailTemplates(emailTemplates),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}
