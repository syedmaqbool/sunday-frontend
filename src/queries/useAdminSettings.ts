

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminSettingsService,
  type BoostPackageAPI,
} from "@/services/adminSettings.service";

const ADMIN_SETTINGS_KEY = ["admin-settings"];

export const useAdminSettings = () =>
  useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: async () => {
      const res = await adminSettingsService.get();
      return res.data;
    },
  });

export const useUpdateBoostPackages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boostPackages: BoostPackageAPI[]) =>
      adminSettingsService.updateBoostPackages(boostPackages),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    },
  });
};


export const useUpdateHelpCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpCategories: import("@/services/adminSettings.service").HelpCategoryAPI[]) =>
      adminSettingsService.updateHelpCategories(helpCategories),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY }),
  });
};

export const useUpdateHelpFaqs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpFaqs: import("@/services/adminSettings.service").HelpFaqAPI[]) =>
      adminSettingsService.updateHelpFaqs(helpFaqs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY }),
  });
};

export const useUpdateHelpTutorials = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (helpTutorials: import("@/services/adminSettings.service").HelpTutorialAPI[]) =>
      adminSettingsService.updateHelpTutorials(helpTutorials),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY }),
  });
};


