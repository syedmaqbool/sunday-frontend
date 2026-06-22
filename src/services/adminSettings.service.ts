
import { apiClient } from "@/lib/apiClient";

export interface BoostPackageAPI {
  id: string;
  name: string;
  placement: "TRENDING" | "FOR_YOU" | "SEARCH";
  durationDays: number;
  price: number;
  credits: number;
  description: string;
  active: boolean;
}

export interface AdminSettings {
  boostPackages: BoostPackageAPI[];
  emailTemplates: unknown[];
  flagKeywords: string[];
  helpCategories: unknown[];
  helpContent: unknown[];
  helpFaqs: unknown[];
  helpTutorials: unknown[];
}

interface ItemResponse<T> {
  data: T;
}

export interface HelpCategoryAPI {
  active: boolean;
  key: string;
  label: string;
  sortOrder: number;
}

export interface HelpFaqAPI {
  id: string;
  answer: string;
  categoryKey: string;
  published: boolean;
  question: string;
  sortOrder: number;
}

export interface HelpTutorialAPI {
  id: string;
  body: string;
  published: boolean;
  slug: string;
  sortOrder: number;
  title: string;
}

export const adminSettingsService = {
  // ... existing get(), updateBoostPackages() yahan rahenge ...
get: () =>
    apiClient.get<ItemResponse<AdminSettings>>("/api/v1/admin/settings"),

  // Sirf boostPackages key update karta hai — baqi settings untouched rehte hain
  // (repository partial-update support karta hai per top-level key)
  updateBoostPackages: (boostPackages: BoostPackageAPI[]) =>
    apiClient.patch<ItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { boostPackages },
    ),



  updateHelpCategories: (helpCategories: HelpCategoryAPI[]) =>
    apiClient.patch<ItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { helpCategories },
    ),

  updateHelpFaqs: (helpFaqs: HelpFaqAPI[]) =>
    apiClient.patch<ItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { helpFaqs },
    ),

  updateHelpTutorials: (helpTutorials: HelpTutorialAPI[]) =>
    apiClient.patch<ItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { helpTutorials },
    ),
};




