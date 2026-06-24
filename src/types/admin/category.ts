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

export type CreateCategoryPayload = {
  label: string;
  value: string;
  icon?: string;
  sortOrder?: number;
};

export type UpdateCategoryPayload = {
  label?: string;
  icon?: string;
  sortOrder?: number;
};

export type CreateSubcategoryPayload = {
  categoryId: string;
  label: string;
  value: string;
  icon?: string;
  sortOrder?: number;
};

export type UpdateSubcategoryPayload = {
  label?: string;
  icon?: string;
  sortOrder?: number;
  categoryId?: string;
};
