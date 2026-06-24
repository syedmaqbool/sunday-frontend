export interface CommissionTier {
  id: string;
  name: string;
  categories: string[];
  minPrice: number;
  maxPrice: number | null;
  rate: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CommissionTierPayload {
  name: string;
  categories: string[];
  minPrice?: number;
  maxPrice?: number | null;
  rate: number;
  active?: boolean;
  sortOrder?: number;
}
