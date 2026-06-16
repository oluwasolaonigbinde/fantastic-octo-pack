import type { Order } from "@/types/order";
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

const orderService = {
  createDirectOrder,
  fetchOrders,
  fetchOrderDetail,
  cancelOrder,
};

export default orderService;
