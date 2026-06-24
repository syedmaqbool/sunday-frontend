export interface AdminOrderItem {
  id: string;
  orderId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  reservationId: string | null;
  offerId: string | null;
  title: string;
  brand: string;
  imageUrl: string;
  description: string;
  condition: string;
  size: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  commissionRate: number;
  commissionAmount: number;
  platformFeeAmount: number;
  commissionTierId: string | null;
  commissionTierName: string | null;
  reservedOfferPrice: number | null;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: "CONFIRMED" | "SHIPPED" | "DELIVERED";
  shippingMethod: string | null;
  trackingNumber: string | null;
  expectedDelivery: string | null;
  proofImageUrl: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currency: "PKR";
  sellerFullName: string;
  buyerFullName: string;
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
  currency: "PKR";
  status: "CONFIRMED" | "PARTIALLY_SHIPPED" | "SHIPPED" | "PARTIALLY_DELIVERED" | "DELIVERED";
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  commissionAmount: number;
  platformFeeAmount: number;
  total: number;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  shippingPhone: string;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  itemStatusCounts: AdminOrderItemStatusCounts;
}

export interface ReservedListing {
  buyerId: string;
  listingId: string;
  reservationId: string;
  sellerId: string;
  buyerFullName: string;
  price: number;
  reservationExpiresAt: string;
  sellerFullName: string;
  title: string;
}
