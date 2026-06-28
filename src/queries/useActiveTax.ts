import { queryOptions } from '@tanstack/react-query';
import { getTaxSettings } from '@/services/taxSetting.service';

export interface ActiveTax {
  id: string;
  name: string;
  rate: number;
}

export const activeTaxQueryKey = {
  current: () => ['active-tax'] as const,
};

export function getActiveTaxOptions() {
  return queryOptions({
    queryFn: async (): Promise<ActiveTax | null> => {
      const { data } = await getTaxSettings();
      return data
        ? { id: data.id, name: data.name, rate: Number(data.rate) }
        : null;
    },
    queryKey: activeTaxQueryKey.current(),
  });
}
