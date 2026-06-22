import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  brandService,
  type CreateBrandPayload,
  type UpdateBrandPayload,
} from "@/services/brand.service";

const BRANDS_KEY = ["brands"];

export const useBrands = () =>
  useQuery({
    queryKey: BRANDS_KEY,
    queryFn: async () => {
      const res = await brandService.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandPayload) =>
      brandService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
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
    }) => brandService.update(brandId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) =>
      brandService.delete(brandId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
    },
  });
};


