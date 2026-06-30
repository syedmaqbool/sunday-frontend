export interface AdminOrderItem {
  id: string;
  buyerId: string;
  commissionTierId: string | null;
  listingId: string;
  offerId: string | null;
  orderId: string;
  reservationId: string | null;
  sellerId: string;
  brand: string;
  buyerFullName: string;
  category: string;
  commissionAmount: number;
  commissionRate: number;
  commissionTierName: string | null;
  condition: string;
  currency: 'PKR';
  description: string;
  discountAmount: number;
  expectedDelivery: string | null;
  imageUrl: string;
  platformFeeAmount: number;
  price: number;
  proofImageUrl: string | null;
  quantity: number;
  reservedOfferPrice: number | null;
  sellerFullName: string;
  shippingMethod: string | null;
  size: string;
  status: 'CONFIRMED' | 'DELIVERED' | 'SHIPPED';
  subcategory: string;
  taxAmount: number;
  title: string;
  total: number;
  trackingNumber: string | null;
  receivedAt: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItemStatusCounts {
  completed: number;
  confirmed: number;
  received: number;
  shipped: number;
}

export interface AdminOrder {
  id: string;
  buyerId: string;
  buyerFullName: string;
  commissionAmount: number;
  currency: 'PKR';
  discountAmount: number;
  discountCode: string | null;
  items: AdminOrderItem[];
  itemStatusCounts: AdminOrderItemStatusCounts;
  platformFeeAmount: number;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
  status: 'CONFIRMED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'PARTIALLY_SHIPPED' | 'SHIPPED';
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReservedListing {
  buyerId: string;
  listingId: string;
  reservationId: string;
  sellerId: string;
  buyerFullName: string;
  price: number;
  sellerFullName: string;
  title: string;
  reservationExpiresAt: string;
}
