import {
  CreateServiceRequestPayload,
  ServiceRequestListResponse,
  ServiceRequestResponse,
  UpdateServiceRequestStatusPayload,
} from "@/types/service-request";
import { apiUrl } from "@/utils/api-base-url";

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

const createServiceRequest = async (
  token: string,
  data: CreateServiceRequestPayload | FormData
): Promise<ServiceRequestResponse> => {
  const isFormData = data instanceof FormData;
  const response = await fetch(apiUrl("/service-requests"), {
    method: "POST",
    headers: isFormData
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to create service request")
    );
  }

  return response.json();
};

const fetchServiceRequests = async (
  token: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<ServiceRequestListResponse> => {
  const url = new URL(apiUrl("/service-requests"));

  if (params?.page) url.searchParams.append("page", String(params.page));
  if (params?.limit) url.searchParams.append("limit", String(params.limit));
  if (params?.status) url.searchParams.append("status", params.status);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch service requests")
    );
  }

  const body = (await response.json()) as ServiceRequestListResponse | {
    success: boolean;
    message: string;
    data: unknown;
  };

  // Backend returns `data` as a plain array; client state expects paginated shape.
  if (body.success && Array.isArray(body.data)) {
    const docs = body.data;
    return {
      success: body.success,
      message: body.message,
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

  return body as ServiceRequestListResponse;
};

const fetchServiceRequestById = async (
  token: string,
  id: string
): Promise<ServiceRequestResponse> => {
  const response = await fetch(apiUrl(`/service-requests/${id}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch service request")
    );
  }

  return response.json();
};

const updateServiceRequestStatus = async (
  token: string,
  id: string,
  payload: UpdateServiceRequestStatusPayload
): Promise<ServiceRequestResponse> => {
  const response = await fetch(apiUrl(`/service-requests/${id}/status`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        "Failed to update service request status"
      )
    );
  }

  return response.json();
};

const fetchAdminServiceRequests = async (
  token: string,
): Promise<ServiceRequestListResponse> => {
  const response = await fetch(apiUrl("/admin/service-requests"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch admin service requests")
    );
  }

  const body = (await response.json()) as ServiceRequestListResponse | {
    success: boolean;
    message: string;
    data: unknown;
  };

  if (body.success && Array.isArray(body.data)) {
    const docs = body.data;
    return {
      success: body.success,
      message: body.message,
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

  return body as ServiceRequestListResponse;
};

const fetchAdminServiceRequestById = async (
  token: string,
  id: string
): Promise<ServiceRequestResponse> => {
  const response = await fetch(apiUrl(`/admin/service-requests/${id}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch admin service request")
    );
  }

  return response.json();
};

const buyerMarkCompleted = async (
  token: string,
  id: string
): Promise<ServiceRequestResponse> => {
  const response = await fetch(apiUrl(`/service-requests/${id}/buyer-complete`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        "Failed to mark service request as completed"
      )
    );
  }

  return response.json();
};

const serviceRequestService = {
  createServiceRequest,
  fetchServiceRequests,
  fetchServiceRequestById,
  updateServiceRequestStatus,
  buyerMarkCompleted,
  fetchAdminServiceRequests,
  fetchAdminServiceRequestById,
};

export default serviceRequestService;
