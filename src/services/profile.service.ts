import { authInstance } from "@/services/ky.instance";
import type {
  Profile,
  UpdateBankDetailsPayload,
  UpdateProfilePayload,
  UploadedFile,
} from "@/types/profile";
import type { Response } from "@/types/response.type";

export function getMyProfile() {
  return authInstance.get("/api/v1/profiles/me").json<Response<Profile>>();
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return authInstance
    .patch("/api/v1/profiles/me", { json: payload })
    .json<Response<Profile>>();
}

export function updateMyBankDetails(payload: UpdateBankDetailsPayload) {
  return authInstance
    .patch("/api/v1/profiles/me/bank-details", { json: payload })
    .json<Response<Profile>>();
}

export function uploadProfileFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return authInstance
    .post("/api/upload-file", { body: formData })
    .json<Response<UploadedFile>>();
}
