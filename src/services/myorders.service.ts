import { apiClient } from "@/lib/apiClient";

export interface OrderItem {
  id:                  string;
  orderId:             string;
  listingId:           string;
  sellerId:            string;
  buyerId:             string;
  title:               string;
  brand:               string;
  imageUrl:            string;
  description:         string;
  condition:           string;
  size:                string;
  category:            string;
  subcategory:         string;
  price:               number;
  quantity:            number;
  commissionRate:      number;
  commissionAmount:    number;
  platformFeeAmount:   number;
  discountAmount:      number;
  taxAmount:           number;
  total:               number;
  status:              "CONFIRMED" | "SHIPPED" | "DELIVERED";
  shippingMethod:      string | null;
  trackingNumber:      string | null;
  expectedDelivery:    string | null;
  proofImageUrl:       string | null;
  shippedAt:           string | null;
  receivedAt:          string | null;
  sellerFullName:      string;
  buyerFullName:       string;
  currency:            "PKR";
  reservedOfferPrice:  number | null;
  createdAt:           string;
  updatedAt:           string;
}

export interface Order {
  id:               string;
  buyerId:          string;
  buyerFullName:    string;
  currency:         "PKR";
  status:           string;
  subtotal:         number;
  discountCode:     string | null;
  discountAmount:   number;
  taxRate:          number;
  taxAmount:        number;
  commissionAmount: number;
  platformFeeAmount: number;
  total:            number;
  shippingFirstName: string;
  shippingLastName:  string;
  shippingAddress:   string;
  shippingCity:      string;
  shippingPostal:    string;
  shippingPhone:     string;
  items:            OrderItem[];
  createdAt:        string;
  updatedAt:        string;
}

interface ListResponse<T> { data: T[]; pagination: unknown; }

export const myOrdersService = {
  listOrders: () =>
    apiClient.get<ListResponse<Order>>("/api/v1/me/orders?size=100"),

  listSales: () =>
    apiClient.get<ListResponse<OrderItem>>("/api/v1/me/sales?size=100"),

  updateItemStatus: (
    orderId: string,
    orderItemId: string,
    payload: {
      status: "SHIPPED" | "DELIVERED";
      shippingMethod?: string;
      trackingNumber?: string;
      expectedDelivery?: string; // ISO date-time
    },
  ) =>
    apiClient.patch<void>(
      `/api/v1/orders/${orderId}/items/${orderItemId}`,
      payload,
    ),

  uploadShippingProof: (orderId: string, orderItemId: string, proofImageUrl: string) =>
    apiClient.post<void>(
      `/api/v1/orders/${orderId}/items/${orderItemId}/shipping-proof`,
      { proofImageUrl },
    ),
};