import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAdminSettings,
  updateAdminBoostPackages,
  updateEmailTemplates,
  updateHelpCategories,
  updateHelpFaqs,
  updateHelpTutorials,
} from "@/services/adminSettings.service";
import type {
  EmailTemplateAPI,
  HelpCategoryAPI,
  HelpFaqAPI,
  HelpTutorialAPI,
} from "@/types/admin/settings";
import type { BoostPackageAPI } from "@/types/boost";

export const adminSettingsQueryKey = {
  all: () => ["admin-settings"] as const,
  details: () => [...adminSettingsQueryKey.all(), "details"] as const,
};

export const getAdminSettingsOptions = () =>
  queryOptions({
    queryKey: adminSettingsQueryKey.details(),
    queryFn: async () => {
      const res = await getAdminSettings();
      return res.data;
    },
  });

export const useAdminSettings = () => useQuery(getAdminSettingsOptions());

export const useUpdateBoostPackages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boostPackages: BoostPackageAPI[]) =>
      updateAdminBoostPackages(boostPackages),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() });
    },
  });
};

export const useUpdateHelpCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpCategories: HelpCategoryAPI[]) =>
      updateHelpCategories(helpCategories),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
};

export const useUpdateHelpFaqs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpFaqs: HelpFaqAPI[]) => updateHelpFaqs(helpFaqs),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
};

export const useUpdateHelpTutorials = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpTutorials: HelpTutorialAPI[]) =>
      updateHelpTutorials(helpTutorials),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
};

export const useUpdateEmailTemplates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailTemplates: EmailTemplateAPI[]) =>
      updateEmailTemplates(emailTemplates),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: adminSettingsQueryKey.all() }),
  });
};
