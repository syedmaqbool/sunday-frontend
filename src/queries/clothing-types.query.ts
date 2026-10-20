import type { ClothingType } from '@/types/clothing-type.type';
import { queryOptions } from '@tanstack/react-query';
import { listClothingTypes } from '@/services/clothing-type.service';

export type { ClothingType } from '@/types/clothing-type.type';

export const clothingTypesQueryKey = {
  all: () => ['clothing-types'] as const,
  list: () => [...clothingTypesQueryKey.all(), 'list'] as const,
};

export function getClothingTypesOptions() {
  return queryOptions({
    queryFn: async () => {
      const firstPage = await listClothingTypes();
      let clothingTypes: ClothingType[] = firstPage.data;

      for (let page = 2; page <= firstPage.pagination.lastPage; page++) {
        const response = await listClothingTypes(page);
        clothingTypes = [...clothingTypes, ...response.data];
      }

      return clothingTypes;
    },
    queryKey: clothingTypesQueryKey.list(),
    staleTime: 5 * 60 * 1000,
  });
}
