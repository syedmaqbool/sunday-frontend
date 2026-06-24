import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBrand,
  deleteBrand,
  listBrands,
  updateBrand,
} from "@/services/brand.service";
import type { CreateBrandPayload, UpdateBrandPayload } from "@/types/brand";

export const brandsQueryKey = {
  all: () => ["brands"] as const,
  list: () => [...brandsQueryKey.all(), "list"] as const,
};

export const getBrandsQueryOptions = () =>
  queryOptions({
    queryKey: brandsQueryKey.list(),
    queryFn: async () => {
      const res = await listBrands();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBrands = () => useQuery(getBrandsQueryOptions());

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrand(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey.all() });
    },
  });
};

export const useUpdateBrand = () => {
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
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteBrand(brandId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKey.all() });
    },
  });
};
