export interface Brand {
  id: string;
  active: boolean;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandPayload {
  active?: boolean;
  name: string;
  sortOrder?: number;
}

export interface UpdateBrandPayload {
  active?: boolean;
  name?: string;
  sortOrder?: number;
}
