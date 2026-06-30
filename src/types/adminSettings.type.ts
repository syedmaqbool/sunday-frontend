import type { BoostPackageAPI } from '@/types/boost.type';

export interface AdminSettings {
  boostPackages: BoostPackageAPI[];
  emailTemplates: EmailTemplateAPI[];
  flagKeywords: string[];
  helpCategories: HelpCategoryAPI[];
  helpContent: unknown[];
  helpFaqs: HelpFaqAPI[];
  helpTutorials: HelpTutorialAPI[];
}

export interface HelpCategoryAPI {
  key: string;
  active: boolean;
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
  key: string;
  id: string;
  body: string;
  subject: string;
}
