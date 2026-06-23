import { apiUrl } from "@/utils/api-base-url";
import type {
  AllPaymentsQuery,
  MyPaymentsQuery,
  PaymentListResponse,
} from "@/types/payment";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

const buildQuery = (params: object) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

/** GET /payments/me — List the authenticated user's transactions. */
const fetchMyPayments = async (
  token: string,
  query: MyPaymentsQuery = {},
): Promise<PaymentListResponse> => {
  const response = await fetch(apiUrl(`/payments/me${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch transactions"),
    );
  }

  return response.json();
};

/** GET /payments — List all payment transactions (admin). */
const fetchPayments = async (
  token: string,
  query: AllPaymentsQuery = {},
): Promise<PaymentListResponse> => {
  const response = await fetch(apiUrl(`/payments${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch payments"),
    );
  }

  return response.json();
};

export const paymentService = {
  fetchMyPayments,
  fetchPayments,
};

export default paymentService;
