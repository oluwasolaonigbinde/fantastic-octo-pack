import { apiUrl } from "@/utils/api-base-url";
import type {
  CreateOrderDisputePayload,
  OrderDispute,
  OrderDisputeListResponse,
  OrderDisputeResponse,
  ResolveOrderDisputePayload,
} from "@/types/order-dispute";

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

const withAuthHeaders = (token: string, isFormData = false): HeadersInit =>
  isFormData
    ? { Authorization: `Bearer ${token}` }
    : {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

/**
 * POST /order-disputes/order/{id} — Raise a dispute against an order (buyer).
 * Accepts an optional evidence file, so the payload is sent as multipart form data.
 */
const createOrderDispute = async (
  token: string,
  orderId: string,
  payload: CreateOrderDisputePayload,
  file?: File,
): Promise<OrderDispute> => {
  const formData = new FormData();
  formData.append("reason", payload.reason);
  formData.append("description", payload.description);
  if (file) {
    formData.append("file", file);
  }

  const response = await fetch(apiUrl(`/order-disputes/order/${orderId}`), {
    method: "POST",
    headers: withAuthHeaders(token, true),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to raise order dispute"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

/** GET /order-disputes — List order disputes for the authenticated user. */
const fetchOrderDisputes = async (
  token: string,
): Promise<OrderDisputeListResponse> => {
  const response = await fetch(apiUrl("/order-disputes"), {
    method: "GET",
    headers: withAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch order disputes"),
    );
  }

  return response.json();
};

/** GET /order-disputes/{id} — Get an order dispute. */
const fetchOrderDisputeById = async (
  token: string,
  disputeId: string,
): Promise<OrderDispute> => {
  const response = await fetch(apiUrl(`/order-disputes/${disputeId}`), {
    method: "GET",
    headers: withAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch order dispute"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

/** POST /order-disputes/{id}/comments — Add a comment to an order dispute. */
const addOrderDisputeComment = async (
  token: string,
  disputeId: string,
  text: string,
): Promise<OrderDispute> => {
  const response = await fetch(
    apiUrl(`/order-disputes/${disputeId}/comments`),
    {
      method: "POST",
      headers: withAuthHeaders(token),
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to add dispute comment"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

/** POST /order-disputes/{id}/evidence — Upload evidence to an order dispute. */
const addOrderDisputeEvidence = async (
  token: string,
  disputeId: string,
  file: File,
): Promise<OrderDispute> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    apiUrl(`/order-disputes/${disputeId}/evidence`),
    {
      method: "POST",
      headers: withAuthHeaders(token, true),
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to upload dispute evidence"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

/** POST /order-disputes/{id}/request-evidence — Request additional evidence (admin). */
const requestOrderDisputeEvidence = async (
  token: string,
  disputeId: string,
  note?: string,
): Promise<OrderDispute> => {
  const response = await fetch(
    apiUrl(`/order-disputes/${disputeId}/request-evidence`),
    {
      method: "POST",
      headers: withAuthHeaders(token),
      body: JSON.stringify({ note }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to request more evidence"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

/** POST /order-disputes/{id}/resolve — Resolve an order dispute (admin). */
const resolveOrderDispute = async (
  token: string,
  disputeId: string,
  payload: ResolveOrderDisputePayload,
): Promise<OrderDispute> => {
  const response = await fetch(apiUrl(`/order-disputes/${disputeId}/resolve`), {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to resolve order dispute"),
    );
  }

  const body = (await response.json()) as OrderDisputeResponse;
  return body.data;
};

export const orderDisputeService = {
  createOrderDispute,
  fetchOrderDisputes,
  fetchOrderDisputeById,
  addOrderDisputeComment,
  addOrderDisputeEvidence,
  requestOrderDisputeEvidence,
  resolveOrderDispute,
};

export default orderDisputeService;
