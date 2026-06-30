export interface Category {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  categoryLabel: string;
  categoryValue: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  icon?: string;
  label: string;
  sortOrder?: number;
  value: string;
}

export interface UpdateCategoryPayload {
  icon?: string;
  label?: string;
  sortOrder?: number;
}

export interface CreateSubcategoryPayload {
  categoryId: string;
  icon?: string;
  label: string;
  sortOrder?: number;
  value: string;
}

export interface UpdateSubcategoryPayload {
  categoryId?: string;
  icon?: string;
  label?: string;
  sortOrder?: number;
}
