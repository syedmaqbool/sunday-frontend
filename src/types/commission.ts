export interface CommissionTier {
  id: string;
  active: boolean;
  categories: string[];
  maxPrice: number | null;
  minPrice: number;
  name: string;
  rate: number;
  sortOrder: number;
  createdAt: string;
}

export interface CommissionTierPayload {
  active?: boolean;
  categories: string[];
  maxPrice?: number | null;
  minPrice?: number;
  name: string;
  rate: number;
  sortOrder?: number;
}
