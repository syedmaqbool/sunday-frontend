export interface Brand {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandPayload {
  name: string;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdateBrandPayload {
  name?: string;
  active?: boolean;
  sortOrder?: number;
}
