import type { Order } from "@/types/order";
import type {
  Rfq,
  Quote,
  RfqDetailResponse,
  BulkRfqBatchListItem,
  BulkBatchDetailResponse,
  BulkRfqItemPayload,
  CreateBulkRfqResponse,
} from "@/types/rfq";
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

// --- Buyer RFQ operations ---

export const createRfq = async (
  token: string,
  data: {
    items: { product: string; productName: string; quantity: number; notes?: string; model?: string; description?: string }[];
    targetDistributors: string[];
    additionalNotes?: string;
    isBulk?: boolean;
    title?: string;
    deliveryLocation?: string;
  },
  attachments?: File[]
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append("items", JSON.stringify(data.items));
    formData.append("targetDistributors", JSON.stringify(data.targetDistributors));
    if (data.additionalNotes) formData.append("additionalNotes", data.additionalNotes);
    if (data.isBulk !== undefined) formData.append("isBulk", String(data.isBulk));
    if (data.title) formData.append("title", data.title);
    if (data.deliveryLocation) formData.append("deliveryLocation", data.deliveryLocation);
    for (const file of attachments) {
      formData.append("attachments", file);
    }
    const res = await fetch(apiUrl("/rfqs"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return handleResponse(res);
  }

  const res = await fetch(apiUrl("/rfqs"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateRfqDraft = async (
  token: string,
  rfqId: string,
  data: Partial<{
    items: { product: string; productName: string; quantity: number; notes?: string }[];
    targetDistributors: string[];
    additionalNotes?: string;
    isBulk?: boolean;
    title?: string;
  }>
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const submitRfq = async (
  token: string,
  rfqId: string
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/submit`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchBuyerRfqs = async (
  token: string
): Promise<{ success: boolean; message: string; data: Rfq[] }> => {
  const res = await fetch(apiUrl("/rfqs"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchRfqDetail = async (
  token: string,
  rfqId: string
): Promise<{ success: boolean; message: string; data: RfqDetailResponse }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}`), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchBuyerReceivedQuotes = async (
  token: string
): Promise<{ success: boolean; message: string; data: Quote[] }> => {
  const res = await fetch(apiUrl("/rfqs/quotes/received"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const closeRfq = async (
  token: string,
  rfqId: string
): Promise<{ success: boolean; message: string; data: Rfq }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/close`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

// --- Quote operations ---

export const selectQuote = async (
  token: string,
  quoteId: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/select`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchDistributorInbox = async (
  token: string
): Promise<{ success: boolean; message: string; data: Quote[] }> => {
  const res = await fetch(apiUrl("/rfqs/inbox/quotes"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchQuoteDetail = async (
  token: string,
  quoteId: string
): Promise<{ success: boolean; message: string; data: Quote }> => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}`), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const respondToQuote = async (
  token: string,
  quoteId: string,
  data: {
    response: "quoted" | "unavailable";
    pricePerUnit?: number;
    totalPrice?: number;
    quantity?: number;
    terms?: string;
    notes?: string;
    leadTimeDays?: number;
    validUntil?: string;
    availableModel?: string;
    warranty?: string;
    stockStatus?: string;
  },
  files?: { images?: File[]; catalogue?: File }
): Promise<{ success: boolean; message: string; data: Quote }> => {
  if (files && (files.images?.length || files.catalogue)) {
    const formData = new FormData();
    formData.append("response", data.response);
    if (data.pricePerUnit !== undefined) formData.append("pricePerUnit", String(data.pricePerUnit));
    if (data.totalPrice !== undefined) formData.append("totalPrice", String(data.totalPrice));
    if (data.quantity !== undefined) formData.append("quantity", String(data.quantity));
    if (data.terms) formData.append("terms", data.terms);
    if (data.notes) formData.append("notes", data.notes);
    if (data.leadTimeDays !== undefined) formData.append("leadTimeDays", String(data.leadTimeDays));
    if (data.validUntil) formData.append("validUntil", data.validUntil);
    if (data.availableModel) formData.append("availableModel", data.availableModel);
    if (data.warranty) formData.append("warranty", data.warranty);
    if (data.stockStatus) formData.append("stockStatus", data.stockStatus);
    if (files.images) {
      for (const img of files.images) {
        formData.append("images", img);
      }
    }
    if (files.catalogue) {
      formData.append("catalogue", files.catalogue);
    }
    const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/respond`), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return handleResponse(res);
  }

  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/respond`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const acceptOffer = async (
  token: string,
  quoteId: string
): Promise<{ success: boolean; message: string; data: Order }> => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/accept`), {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const rejectOffer = async (
  token: string,
  quoteId: string,
  reason?: string
): Promise<{ success: boolean; message: string; data: Quote }> => {
  const res = await fetch(apiUrl(`/rfqs/quotes/${quoteId}/reject`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return handleResponse(res);
};

export const sendReminder = async (
  token: string,
  rfqId: string,
  distributorId?: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(apiUrl(`/rfqs/${rfqId}/remind`), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(distributorId ? { distributorId } : {}),
  });
  return handleResponse(res);
};

// --- Bulk RFQ operations ---

export const createBulkRfq = async (
  token: string,
  data: { items: BulkRfqItemPayload[]; title?: string }
): Promise<{ success: boolean; message: string; data: CreateBulkRfqResponse }> => {
  const res = await fetch(apiUrl("/rfqs/bulk"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const fetchDistributorBulkBatches = async (
  token: string
): Promise<{ success: boolean; message: string; data: BulkRfqBatchListItem[] }> => {
  const res = await fetch(apiUrl("/rfqs/bulk/batches"), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

export const fetchBulkBatchDetail = async (
  token: string,
  batchId: string
): Promise<{ success: boolean; message: string; data: BulkBatchDetailResponse }> => {
  const res = await fetch(apiUrl(`/rfqs/bulk/batches/${batchId}`), {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(res);
};

const rfqService = {
  createRfq,
  updateRfqDraft,
  submitRfq,
  fetchBuyerRfqs,
  fetchRfqDetail,
  fetchBuyerReceivedQuotes,
  closeRfq,
  selectQuote,
  fetchDistributorInbox,
  fetchQuoteDetail,
  respondToQuote,
  acceptOffer,
  rejectOffer,
  sendReminder,
  createBulkRfq,
  fetchDistributorBulkBatches,
  fetchBulkBatchDetail,
};

export default rfqService;
