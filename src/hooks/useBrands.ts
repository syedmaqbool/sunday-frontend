import { useQuery } from '@tanstack/react-query';
import { getBrandsOptions } from '@/queries/useBrands';

export type { Brand } from '@/queries/useBrands';

export function useBrands(isIncludingInactive = false) {
  return useQuery(getBrandsOptions(isIncludingInactive));
}
