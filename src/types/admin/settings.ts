import type { BoostPackageAPI } from "@/types/boost";

export interface AdminSettings {
  boostPackages: BoostPackageAPI[];
  emailTemplates: EmailTemplateAPI[];
  flagKeywords: string[];
  helpCategories: unknown[];
  helpContent: unknown[];
  helpFaqs: unknown[];
  helpTutorials: unknown[];
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

export interface EmailTemplateAPI {
  id: string;
  body: string;
  key: string;
  subject: string;
}
