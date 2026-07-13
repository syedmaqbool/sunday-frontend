export interface OrderItem {
  id: string;
  buyerId: string;
  listingId: string;
  orderId: string;
  sellerId: string;
  brand: string;
  buyerFullName: string;
  category: string;
  commissionAmount: number;
  commissionRate: number;
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

export interface Order {
  id: string;
  buyerId: string;
  buyerFullName: string;
  commissionAmount: number;
  currency: 'PKR';
  discountAmount: number;
  discountCode: string | null;
  items: OrderItem[];
  paymentStatus: 'FAILED' | 'PAID' | 'PENDING' | 'UNPAID';
  platformFeeAmount: number;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderItemStatusPayload {
  expectedDelivery?: string;
  shippingMethod?: string;
  status: 'DELIVERED' | 'SHIPPED';
  trackingNumber?: string;
}
