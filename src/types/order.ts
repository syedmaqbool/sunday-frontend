export interface OrderItem {
  id: string;
  orderId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
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
  sellerFullName: string;
  buyerFullName: string;
  currency: "PKR";
  reservedOfferPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerFullName: string;
  currency: "PKR";
  status: string;
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
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type UpdateOrderItemStatusPayload = {
  status: "SHIPPED" | "DELIVERED";
  shippingMethod?: string;
  trackingNumber?: string;
  expectedDelivery?: string;
};
