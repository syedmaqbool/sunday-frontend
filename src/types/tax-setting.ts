export interface TaxSetting {
  id: string;
  active: boolean;
  name: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxSettingPayload {
  active?: boolean;
  name: string;
  rate: number;
}

export interface UpdateTaxSettingPayload {
  active?: boolean;
  name?: string;
  rate?: number;
}
