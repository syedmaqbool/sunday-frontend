import type { CreateBrandPayload, UpdateBrandPayload } from '@/types/brand.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBrand,
  deleteBrand,
  listBrands,
  updateBrand,
} from '@/services/brand.service';

export const brandsQueryKey = {
  all: () => ['brands'] as const,
  list: () => [...brandsQueryKey.all(), 'list'] as const,
};

export function getBrandsQueryOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listBrands();
      return response.data;
    },
    queryKey: brandsQueryKey.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrand(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey.all() });
    },
  });
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      payload,
    }: {
      brandId: string;
      payload: UpdateBrandPayload;
    }) => updateBrand(brandId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey.all() });
    },
  });
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteBrand(brandId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey.all() });
    },
  });
}

