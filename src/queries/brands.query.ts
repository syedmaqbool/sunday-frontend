import { queryOptions } from '@tanstack/react-query';
import { getBrands } from '@/services/buyerPreferences.service';

export interface Brand {
  id: string;
  active: boolean;
  name: string;
  sortOrder: number;
}

export const brandsQueryKey = {
  list: (isIncludingInactive = false) => ['brands', isIncludingInactive] as const,
};

export function getBrandsOptions(isIncludingInactive = false) {
  return queryOptions({
    queryFn: async (): Promise<Brand[]> => {
      const response = await getBrands();
      return response.data;
    },
    queryKey: brandsQueryKey.list(isIncludingInactive),
  });
}
