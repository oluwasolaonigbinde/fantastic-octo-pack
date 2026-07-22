import type {
  CreateRfqPayload,
  Quote,
  RespondToQuotePayload,
  Rfq,
  RfqDetailResponse,
} from "@/types/rfq";
import type { Order } from "@/types/order";
import { apiUrl } from "@/utils/api-base-url";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
};

const appendRfqFormData = (data: CreateRfqPayload, attachments?: File[]) => {
  const form = new FormData();
  form.append("items", JSON.stringify(data.items));
  if (data.additionalNotes) form.append("additionalNotes", data.additionalNotes);
  if (data.isBulk !== undefined) form.append("isBulk", String(data.isBulk));
  if (data.title) form.append("title", data.title);
  if (data.addressId) form.append("addressId", data.addressId);
  if (data.deliveryTimeline) form.append("deliveryTimeline", data.deliveryTimeline);
  attachments?.slice(0, 3).forEach((file) => form.append("attachments", file));
  return form;
};

/** Creates an RFQ draft using the deployed multipart contract. */
export const createRfq = async (
  token: string,
  data: CreateRfqPayload,
  attachments?: File[],
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  const res = await fetch(apiUrl("/rfqs"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: appendRfqFormData(data, attachments),
  });
  return handleResponse(res);
};

export const updateRfqDraft = async (
  token: string,
  rfqId: string,
  data: Partial<CreateRfqPayload>,
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const submitRfq = async (token: string, rfqId: string) => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/submit`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: Rfq }>(res);
};

/**
 * Downloads the RFQ items Excel template and triggers a browser save. The
 * backend generates it from the live category tree on every request, so the
 * dropdowns always match what the routing engine can match against.
 */
export const downloadRfqTemplate = async (token: string): Promise<void> => {
  const res = await fetch(apiUrl("/rfqs/template"), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unable to download the template" }));
    throw new Error(error.message || "Unable to download the template");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "baiy-rfq-template.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const fetchBuyerRfqs = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs"), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: Rfq[] }>(res);
};

export const fetchRfqDetail = async (token: string, rfqId: string) => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}`), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: RfqDetailResponse }>(res);
};

export const closeRfq = async (token: string, rfqId: string) => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/close`), { method: "POST", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: Rfq }>(res);
};

export const approveQuote = async (token: string, quoteId: string) => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/approve`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: Order }>(res);
};

export const fetchDistributorInbox = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs/inbox/quotes"), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: Quote[] }>(res);
};

export const fetchQuoteDetail = async (token: string, quoteId: string) => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}`), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: Quote }>(res);
};

/** Sends one response per RFQ line, including unavailable lines. */
export const respondToQuote = async (
  token: string,
  quoteId: string,
  data: RespondToQuotePayload,
  files?: { images?: File[]; catalogue?: File },
) => {
  const form = new FormData();
  form.append("items", JSON.stringify(data.items));
  if (data.warranty) form.append("warranty", data.warranty);
  if (data.notes) form.append("notes", data.notes);
  files?.images?.forEach((file) => form.append("images", file));
  if (files?.catalogue) form.append("catalogue", files.catalogue);
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/respond`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return handleResponse<{ success: boolean; message: string; data: Quote }>(res);
};

const rfqService = {
  createRfq,
  updateRfqDraft,
  submitRfq,
  downloadRfqTemplate,
  fetchBuyerRfqs,
  fetchRfqDetail,
  closeRfq,
  approveQuote,
  fetchDistributorInbox,
  fetchQuoteDetail,
  respondToQuote,
};

export default rfqService;
