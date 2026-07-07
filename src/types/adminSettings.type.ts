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
  blurb: string;
  icon: string;
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
  title: string;
  slug: string;
  body: string;
  icon: string;
  steps: string[];
  ctaLabel: string;
  ctaTo: string;
  sortOrder: number;
  published: boolean;
}

export interface EmailTemplateAPI {
  key: string;
  id: string;
  body: string;
  subject: string;
}