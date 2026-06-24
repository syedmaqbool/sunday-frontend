import { apiClient } from "@/lib/apiClient";

export interface ProfileImage {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: string;
}

export interface Profile {
    id: string;
    userId: string;
    address: string;
    bankAccountHolder: string;
    bankAccountNumber: string;
    bankIban: string;
    bankName: string;
    bankSwift: string;
    bio: string;
    dateOfBirth: string;
    fullName: string;
    image: ProfileImage | null;
    location: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfilePayload {
    address?: string;
    bio?: string;
    dateOfBirth?: string;
    fullName?: string;
    image?: string | null; // file UUID
    location?: string;
    phone?: string;
}

export interface UpdateBankDetailsPayload {
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIban?: string;
    bankName?: string;
    bankSwift?: string;
}


export interface UploadedFile {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: string;
}

interface ItemResponse<T> { data: T; }

export const profileService = {
    getMe: () =>
        apiClient.get<ItemResponse<Profile>>("/api/v1/profiles/me"),

    updateMe: (payload: UpdateProfilePayload) =>
        apiClient.patch<ItemResponse<Profile>>("/api/v1/profiles/me", payload),

    updateBankDetails: (payload: UpdateBankDetailsPayload) =>
        apiClient.patch<ItemResponse<Profile>>("/api/v1/profiles/me/bank-details", payload),

    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        return apiClient.upload<ItemResponse<UploadedFile>>(
            "/api/upload-file",
            formData
        );
    },

};