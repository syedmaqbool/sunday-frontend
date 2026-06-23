import { apiClient } from "@/lib/apiClient";

// ── TYPES & INTERFACES ───────────────────────────────────────────────────────
export interface Brand {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

// Brand Response Type Updated as per your new JSON 👇
export interface GetBrandsResponse {
  statusCode: number;
  message: string;
  data: Brand[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    perPage: number;
    prevPage: number | null;
    total: number;
  };
  aggregates: Record<string, string>;
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

export interface GetPreferencesResponse {
  statusCode: number;
  message: string;
  data: UserPreferences;
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
  label: string;
  value: string;
  icon: string;
  sortOrder: number;
}

export interface GetSubcategoriesResponse {
  statusCode: number;
  message: string;
  data: BackendCategory[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    perPage: number;
    prevPage: number | null;
    total: number;
  };
  aggregates: Record<string, string>;
}

// ── SERVICE LAYER ────────────────────────────────────────────────────────────
export const preferencesService = {
  // Get current saved preferences
  getPreferences: () => {
    return apiClient.get<GetPreferencesResponse>("/api/v1/preferences/me");
  },

  // Save / Update preferences
  putPreferences: (payload: PutPreferencesPayload) => {
    return apiClient.put("/api/v1/preferences/me", payload);
  },

  // Get Categories from new backend
  getCategories: () => {
    return apiClient.get<{ data: BackendCategory[] }>("/api/v1/categories");
  },

  // Get Subcategories from new backend
  getSubcategories: () => {
    return apiClient.get<GetSubcategoriesResponse>("/api/v1/subcategories");
  },

  // Get Brands (Mapped to use strict response wrapper) 👇
  getBrands: () => {
    return apiClient.get<GetBrandsResponse>("/api/v1/brands");
  }
};