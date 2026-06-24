export interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxSettingPayload {
  name: string;
  rate: number;
  active?: boolean;
}

export interface UpdateTaxSettingPayload {
  name?: string;
  rate?: number;
  active?: boolean;
}
