export type ListingStatus = 'APPROVED' | 'NEEDS_REVISION' | 'PENDING' | 'REJECTED' | 'RESERVED' | 'SOLD';

export interface ListingMediaFile {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface ListingMedia {
  id: string;
  file: ListingMediaFile | null;
  sortOrder: number;
  type: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface AdminListing {
  id: string;
  categoryId: string;
  sellerId: string;
  subcategoryId: string;
  brand: string;
  categoryLabel: string;
  categoryValue: string;
  condition: string;
  coverImage: ListingMediaFile | null;
  description: string;
  media: ListingMedia[];
  price: number;
  reservedUntil: string | null;
  size: string;
  status: ListingStatus;
  subcategoryLabel: string;
  subcategoryValue: string;
  title: string;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModerateListingPayload {
  feedback?: string;
  status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
}
