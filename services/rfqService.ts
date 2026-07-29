import type {
  BulkRfqCreationResult,
  CreateBulkRfqPayload,
  CreateRfqPayload,
  Quote,
  QuoteSummary,
  RejectQuotePayload,
  RespondToQuotePayload,
  Rfq,
  RfqDetailResponse,
  RfqListFilters,
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

const buildQuery = (filters: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

const appendRfqFormData = (data: CreateRfqPayload, attachments?: File[]) => {
  const form = new FormData();
  form.append("items", JSON.stringify(data.items));
  if (data.additionalNotes) form.append("additionalNotes", data.additionalNotes);
  if (data.isBulk !== undefined) form.append("isBulk", String(data.isBulk));
  if (data.title) form.append("title", data.title);
  if (data.addressId) form.append("addressId", data.addressId);
  if (data.deliveryTimeline) form.append("deliveryTimeline", data.deliveryTimeline);
  // The backend now requires routingMode on create; automatic keeps the previous
  // behaviour of letting the routing engine pick the distributors.
  form.append("routingMode", data.routingMode ?? "automatic");
  if (data.routingMode === "direct") {
    form.append(
      "directDistributorIds",
      JSON.stringify(data.directDistributorIds ?? []),
    );
  }
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

/** `GET /rfqs` — the backend now accepts status and created-at date filters. */
export const fetchBuyerRfqs = async (token: string, filters: RfqListFilters = {}) => {
  const res = await fetch(apiUrl(`/rfqs${buildQuery({ ...filters })}`), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: Rfq[] }>(res);
};

/** `GET /rfqs/quotes/summary` — counts across every quote on the buyer's RFQs. */
export const fetchBuyerQuoteSummary = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs/quotes/summary"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: QuoteSummary }>(res);
};

export const fetchRfqDetail = async (token: string, rfqId: string) => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}`), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: RfqDetailResponse }>(res);
};

/**
 * `POST /rfqs/bulk` — the email-targeted bulk contract. Every row names the
 * distributor it goes to, so the backend creates one RFQ per row and groups
 * them under a single batch. Rows it cannot place come back in `data.errors`
 * rather than failing the whole request.
 */
export const createBulkRfq = async (token: string, data: CreateBulkRfqPayload) => {
  const res = await fetch(apiUrl("/rfqs/bulk"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<{ success: boolean; message: string; data: BulkRfqCreationResult }>(res);
};

/** `GET /rfqs/quotes/received` — every answered quote across the buyer's RFQs. */
export const fetchBuyerReceivedQuotes = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs/quotes/received"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: Quote[] }>(res);
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

/** `POST /rfqs/quotes/:quoteId/reject` — buyer declines a quoted offer. */
export const rejectQuote = async (
  token: string,
  quoteId: string,
  data: RejectQuotePayload = {},
) => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/reject`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<{ success: boolean; message: string; data: Quote }>(res);
};

/**
 * `POST /rfqs/:id/remind` — nudges the distributors still sitting on a pending
 * quote. Without `distributorId` every pending recipient on the RFQ is emailed.
 */
export const sendRfqReminder = async (
  token: string,
  rfqId: string,
  distributorId?: string,
) => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/remind`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(distributorId ? { distributorId } : {}),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
};

export const fetchDistributorInbox = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs/inbox/quotes"), { method: "GET", headers: authHeaders(token) });
  return handleResponse<{ success: boolean; message: string; data: Quote[] }>(res);
};

/** `GET /rfqs/inbox/quotes/summary` — counts across the distributor's inbox. */
export const fetchDistributorQuoteSummary = async (token: string) => {
  const res = await fetch(apiUrl("/rfqs/inbox/quotes/summary"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse<{ success: boolean; message: string; data: QuoteSummary }>(res);
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
  fetchBuyerQuoteSummary,
  fetchBuyerReceivedQuotes,
  fetchRfqDetail,
  createBulkRfq,
  closeRfq,
  approveQuote,
  rejectQuote,
  sendRfqReminder,
  fetchDistributorInbox,
  fetchDistributorQuoteSummary,
  fetchQuoteDetail,
  respondToQuote,
};

export default rfqService;
