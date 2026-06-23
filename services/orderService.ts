import type {
  EscrowSummary,
  Order,
  OrderPaymentResult,
  PayOrderPayload,
} from "@/types/order";
import { apiUrl } from "@/utils/api-base-url";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
};

export const createDirectOrder = async (
  token: string,
  data: {
    product: string;
    productName: string;
    quantity: number;
    seller: string;
    totalPrice: number;
    deliveryAddress?: string;
    notes?: string;
  }
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl("/orders/buy-now"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const fetchOrders = async (
  token: string
): Promise<{ success: boolean; message: string; data: Order[] }> => {
  const res = await fetch(apiUrl("/orders"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchOrderDetail = async (
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}`), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const cancelOrder = async (
  token: string,
  orderId: string,
  reason?: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/cancel`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(res);
};

/**
 * POST /orders/:id/pay — Pay for an order.
 * `method: "wallet"` debits the buyer's wallet into escrow and settles inline.
 * `method: "paystack"` returns a checkout `authorizationUrl` to redirect to.
 */
export const payOrder = async (
  token: string,
  orderId: string,
  payload: PayOrderPayload
): Promise<{ success: boolean; message: string; data: OrderPaymentResult }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/pay`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * POST /orders/:id/received — Buyer confirms receipt of a fulfilled order.
 * Releases escrow to the distributor and moves the order to `completed`.
 */
export const markOrderReceived = async (
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/received`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

/**
 * POST /orders/:id/fulfill — Distributor marks the order fulfilled (sent out for
 * delivery). Advances the order to `fulfilled` and notifies the buyer so they can
 * confirm receipt. The backend does not yet accept delivery evidence, so any
 * uploaded images are display-only on the client.
 */
export const fulfillOrder = async (
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/fulfill`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchEscrowSummary = async (
  token: string
): Promise<{ success: boolean; message: string; data: EscrowSummary }> => {
  const res = await fetch(apiUrl("/orders/escrow/summary"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

const orderService = {
  createDirectOrder,
  fetchOrders,
  fetchOrderDetail,
  cancelOrder,
  payOrder,
  markOrderReceived,
  fulfillOrder,
  fetchEscrowSummary,
};

export default orderService;
