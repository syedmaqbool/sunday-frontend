export interface ProfileImage {
  id: string;
  filename: string;
  mimetype: string;
  size: string;
  url: string;
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
  image?: string | null;
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
  filename: string;
  mimetype: string;
  size: string;
  url: string;
}
