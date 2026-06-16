import type { UserRef, ProductRef } from "./rfq";

export type OrderStatus =
  | "created_pending_payment"
  | "cancelled_pre_payment"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed";

export interface OrderLineItem {
  product: string | ProductRef;
  productName: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  _id: string;
  buyer: string | UserRef;
  seller: string | UserRef;
  rfq?: string;
  quote?: string;
  items: OrderLineItem[];
  totalPrice: number;
  deliveryAddress?: string;
  proposedDeliveryDate?: string;
  paymentStatus?: string;
  status: OrderStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created_pending_payment: "Pending Payment",
  cancelled_pre_payment: "Cancelled",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Delivered",
};
