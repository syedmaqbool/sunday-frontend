import type {
  EmailTemplateAPI,
  HelpCategoryAPI,
  HelpFaqAPI,
  HelpTutorialAPI,
} from '@/types/adminSettings.type';
import type { BoostPackageAPI } from '@/types/boost.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useUpdateBoostPackagesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boostPackages: BoostPackageAPI[]) =>
      updateAdminBoostPackages(boostPackages),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() });
    },
  });
}

export function useUpdateHelpCategoriesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpCategories: HelpCategoryAPI[]) =>
      updateHelpCategories(helpCategories),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateHelpFaqsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpFaqs: HelpFaqAPI[]) => updateHelpFaqs(helpFaqs),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateHelpTutorialsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpTutorials: HelpTutorialAPI[]) =>
      updateHelpTutorials(helpTutorials),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

export function useUpdateEmailTemplatesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailTemplates: EmailTemplateAPI[]) =>
      updateEmailTemplates(emailTemplates),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
}

