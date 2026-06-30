import type {
  DraftOrderUpdate,
  EscrowSummary,
  FulfillmentStage,
  OnBehalfOrderPayload,
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
    /**
     * Id of a saved profile address to deliver to. Omit to use the buyer's
     * default saved address. The delivery address is no longer free text — the
     * backend snapshots it from the buyer's address book.
     */
    addressId?: string;
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

/**
 * POST /orders/on-behalf — a distributor drafts an order for a buyer from inside
 * a conversation. The backend creates a `draft_pending_buyer` order (pricing it
 * from the distributor's product) and sends the buyer an `order_proposal`
 * message. Only one product is supported per call.
 */
export const createOrderOnBehalf = async (
  token: string,
  payload: OnBehalfOrderPayload
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl("/orders/on-behalf"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

/**
 * PATCH /orders/:id/draft — the buyer edits a draft order created on their
 * behalf (quantity, notes, delivery address) before paying.
 */
export const updateOrderDraft = async (
  token: string,
  orderId: string,
  payload: DraftOrderUpdate
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/draft`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
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
 * POST /orders/:id/fulfillment — Distributor advances a paid order through the
 * logistics stages `received → delivered → installed`. `installed` is only valid
 * when the order requires installation. The order becomes buyer-receivable once
 * it reaches its final required stage. The backend does not yet accept delivery
 * evidence, so any uploaded images are display-only on the client.
 */
export const advanceFulfillment = async (
  token: string,
  orderId: string,
  stage: FulfillmentStage
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/orders/${orderId}/fulfillment`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ stage }),
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
  createOrderOnBehalf,
  updateOrderDraft,
  fetchOrders,
  fetchOrderDetail,
  cancelOrder,
  payOrder,
  markOrderReceived,
  advanceFulfillment,
  fetchEscrowSummary,
};

export default orderService;
