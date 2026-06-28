import { apiUrl } from "@/utils/api-base-url";
import type {
  AllPaymentsQuery,
  Bank,
  BanksQuery,
  BanksResponse,
  MyPaymentsQuery,
  PaymentListResponse,
  ResolveAccountQuery,
  ResolveAccountResponse,
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

/** GET /transactions/me — List the authenticated user's transactions. */
const fetchMyPayments = async (
  token: string,
  query: MyPaymentsQuery = {},
): Promise<PaymentListResponse> => {
  const response = await fetch(apiUrl(`/transactions/me${buildQuery(query)}`), {
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

/** GET /transactions — List all transactions (admin). */
const fetchPayments = async (
  token: string,
  query: AllPaymentsQuery = {},
): Promise<PaymentListResponse> => {
  const response = await fetch(apiUrl(`/transactions${buildQuery(query)}`), {
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

/** GET /payments/banks — List banks supported by the payment gateway. */
const fetchBanks = async (
  token: string,
  query: BanksQuery = {},
): Promise<Bank[]> => {
  const response = await fetch(apiUrl(`/payments/banks${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to fetch banks"));
  }

  const body = (await response.json()) as BanksResponse;
  return body.data ?? [];
};

/** GET /payments/banks/resolve — Validate a bank account and return its name. */
const resolveBankAccount = async (
  token: string,
  query: ResolveAccountQuery,
): Promise<string> => {
  const response = await fetch(
    apiUrl(`/payments/banks/resolve${buildQuery(query)}`),
    {
      method: "GET",
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Could not resolve account"),
    );
  }

  const body = (await response.json()) as ResolveAccountResponse;
  return body.data?.accountName ?? "";
};

export const paymentService = {
  fetchMyPayments,
  fetchPayments,
  fetchBanks,
  resolveBankAccount,
};

export default paymentService;
