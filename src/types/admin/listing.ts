export type ListingStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "SOLD" | "RESERVED";

export interface ListingMediaFile {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface ListingMedia {
  id: string;
  type: "IMAGE" | "VIDEO";
  sortOrder: number;
  createdAt: string;
  file: ListingMediaFile | null;
}

export interface AdminListing {
  id: string;
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  price: number;
  reservedUntil: string | null;
  brand: string;
  condition: string;
  size: string;
  weight: number | null;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  categoryLabel: string;
  categoryValue: string;
  subcategoryLabel: string;
  subcategoryValue: string;
  coverImage: ListingMediaFile | null;
  media: ListingMedia[];
}

export interface ModerateListingPayload {
  status: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  feedback?: string;
}
