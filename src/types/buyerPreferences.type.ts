export interface PreferenceBrand {
  id: string;
  active: boolean;
  name: string;
  sortOrder: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  brands: string[];
  budgetMax: number;
  budgetMin: number;
  categories: string[];
  onboardingCompleted: boolean;
  preferredFit: string;
  styles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PutPreferencesPayload {
  brands: string[];
  budgetMax: number;
  budgetMin: number;
  categories: string[];
  onboardingCompleted: boolean;
  preferredFit: string;
  styles: string[];
}

export interface BackendCategory {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
}
