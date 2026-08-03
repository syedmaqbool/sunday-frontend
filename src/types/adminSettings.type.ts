import type { BoostPackageAPI } from '@/types/boost.type';

export interface AdminSettings {
  boostPackages: BoostPackageAPI[];
  emailTemplates: EmailTemplateAPI[];
  flagKeywords: string[];
  helpCategories: HelpCategoryAPI[];
  helpFaqs: HelpFaqAPI[];
}

export interface HelpCategoryAPI {
  key: string;
  active: boolean;
  blurb: string;
  icon: string;
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

export interface EmailTemplateAPI {
  key: string;
  id: string;
  body: string;
  subject: string;
}
