import { queryOptions } from '@tanstack/react-query';
import { listTaxSettings } from '@/services/taxSetting.service';

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
      const response = await listTaxSettings();
      const activeTax = response.data
        .filter(tax => tax.active)
        .toSorted((a, b) => (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))[0];

      return activeTax
        ? {
            id: activeTax.id,
            name: activeTax.name,
            rate: Number(activeTax.rate),
          }
        : null;
    },
    queryKey: activeTaxQueryKey.current(),
  });
}
