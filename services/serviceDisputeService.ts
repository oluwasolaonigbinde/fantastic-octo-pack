import { apiUrl } from "@/utils/api-base-url";
import type {
  ServiceDisputeData,
  ServiceDisputeListResponse,
  ServiceDisputeMutationResponse,
  ServiceDisputeResponse,
} from "@/types/service-dispute";

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

const normalizeListResponse = async (
  response: Response,
): Promise<ServiceDisputeListResponse> => {
  const body = (await response.json()) as ServiceDisputeListResponse;
  if (Array.isArray(body.data)) {
    const docs = body.data;
    return {
      ...body,
      data: {
        docs,
        totalDocs: docs.length,
        limit: docs.length,
        totalPages: 1,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    };
  }

  return body;
};

const createServiceDispute = async (
  token: string,
  serviceRequestId: string,
  payload:
    | {
        reason: string;
        description: string;
      }
    | FormData,
): Promise<ServiceDisputeMutationResponse> => {
  const isFormData = payload instanceof FormData;
  const response = await fetch(apiUrl(`/service-requests/${serviceRequestId}/disputes`), {
    method: "POST",
    headers: withAuthHeaders(token, isFormData),
    body: isFormData ? payload : JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to create service dispute"),
    );
  }

  return response.json();
};

const fetchServiceDisputes = async (
  token: string,
  admin = false,
): Promise<ServiceDisputeData[]> => {
  const response = await fetch(
    apiUrl(admin ? "/admin/service-disputes" : "/service-disputes"),
    {
      method: "GET",
      headers: withAuthHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch service disputes"),
    );
  }

  const body = await normalizeListResponse(response);
  return Array.isArray(body.data) ? body.data : body.data.docs;
};

const fetchServiceDisputeById = async (
  token: string,
  disputeId: string,
  admin = false,
): Promise<ServiceDisputeData> => {
  const response = await fetch(
    apiUrl(`${admin ? "/admin/service-disputes" : "/service-disputes"}/${disputeId}`),
    {
      method: "GET",
      headers: withAuthHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch service dispute"),
    );
  }

  const body = (await response.json()) as ServiceDisputeResponse;
  return body.data;
};

const addServiceDisputeComment = async (
  token: string,
  disputeId: string,
  text: string,
): Promise<ServiceDisputeData> => {
  const response = await fetch(apiUrl(`/service-disputes/${disputeId}/comments`), {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to add dispute comment"),
    );
  }

  const body = (await response.json()) as ServiceDisputeResponse;
  return body.data;
};

const addServiceDisputeEvidence = async (
  token: string,
  disputeId: string,
  file: File,
): Promise<ServiceDisputeData> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl(`/service-disputes/${disputeId}/evidence`), {
    method: "POST",
    headers: withAuthHeaders(token, true),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to add dispute evidence"),
    );
  }

  const body = (await response.json()) as ServiceDisputeResponse;
  return body.data;
};

const requestServiceDisputeEvidence = async (
  token: string,
  disputeId: string,
  note?: string,
): Promise<ServiceDisputeMutationResponse> => {
  const response = await fetch(apiUrl(`/service-disputes/${disputeId}/request-evidence`), {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify({ note }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to request more evidence"),
    );
  }

  return response.json();
};

const resolveServiceDispute = async (
  token: string,
  disputeId: string,
  payload: {
    resolutionOutcome: string;
    resolutionNote?: string;
  },
): Promise<ServiceDisputeMutationResponse> => {
  const response = await fetch(apiUrl(`/service-disputes/${disputeId}/resolve`), {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to resolve service dispute"),
    );
  }

  return response.json();
};

export const serviceDisputeService = {
  createServiceDispute,
  fetchServiceDisputes,
  fetchServiceDisputeById,
  addServiceDisputeComment,
  addServiceDisputeEvidence,
  requestServiceDisputeEvidence,
  resolveServiceDispute,
};
