export interface HelpTutorial {
  id: string;
  ctaLabel: string | null;
  ctaTo: string | null;
  icon: string | null;
  published: boolean;
  sortOrder: number;
  steps: string[];
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHelpTutorialPayload {
  ctaLabel?: string | null;
  ctaTo?: string | null;
  icon?: string | null;
  published?: boolean;
  sortOrder?: number;
  steps: string[];
  title: string;
}

export type UpdateHelpTutorialPayload = Partial<CreateHelpTutorialPayload>;
