import type { Brand } from '@/types/brand.type';
import { queryOptions } from '@tanstack/react-query';
import { getBrands } from '@/services/buyerPreferences.service';

export type { Brand } from '@/types/brand.type';

export const brandsQueryKey = {
  all: () => ['brands'] as const,
  list: (isIncludingInactive = false) =>
    [...brandsQueryKey.all(), 'list', isIncludingInactive] as const,
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
