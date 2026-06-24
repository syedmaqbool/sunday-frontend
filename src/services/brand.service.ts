import { authInstance } from "@/services/ky.instance";
import type {
  Brand,
  CreateBrandPayload,
  UpdateBrandPayload,
} from "@/types/brand";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listBrands() {
  return authInstance
    .get("/api/v1/admin/brands")
    .json<PaginatedResponse<Brand>>();
}

export function getBrandById(brandId: string) {
  return authInstance
    .get(`/api/v1/admin/brands/${brandId}`)
    .json<Response<Brand>>();
}

export function createBrand(payload: CreateBrandPayload) {
  return authInstance
    .post("/api/v1/admin/brands", { json: payload })
    .json<Response<Brand>>();
}

export function updateBrand(brandId: string, payload: UpdateBrandPayload) {
  return authInstance
    .patch(`/api/v1/admin/brands/${brandId}`, { json: payload })
    .json<Response<Brand>>();
}

export function deleteBrand(brandId: string) {
  return authInstance
    .delete(`/api/v1/admin/brands/${brandId}`)
    .json<Response>();
}
