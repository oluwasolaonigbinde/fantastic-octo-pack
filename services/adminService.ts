import { apiUrl } from "@/utils/api-base-url";
import type { UserRole } from "@/types/user";
import type { OrderStatus, OrderSummary } from "@/types/order";
import type {
  Quote,
  QuoteStatus,
  QuoteSummary,
  Rfq,
  RfqStatus,
} from "@/types/rfq";
import type { ServiceRequestSummary } from "@/types/service-request";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminPagination<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface AdminDashboardSummary {
  users: {
    total: number;
    buyers: number;
    distributors: number;
    oems: number;
    engineers: number;
    agents: number;
  };
  rfqs: {
    total: number;
    rfqsSent: number;
    quotesSent: number;
  };
  revenue: {
    supported: boolean;
    total: number;
    monthly: Array<{ month: string; total: number }>;
  };
  approvals: {
    total: number;
    accounts: number;
    productListings: number;
  };
  onboardingAnalytics: Array<{
    month: string;
    buyers: number;
    distributors: number;
    oems: number;
    engineers: number;
  }>;
  topProductsByRfqs: Array<{
    id: string;
    name: string;
    rfqCount: number;
    imageUrl: string | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    type: string;
    dateOnboarded: string | null;
    avatarUrl: string | null;
  }>;
}

export interface AdminPlatformUsersSummary {
  approvedUsers: {
    total: number;
    buyers: number;
    distributors: number;
    oems: number;
    engineers: number;
    agents: number;
  };
  onboardingRequests: {
    supported: boolean;
    total: number;
    distributors: number;
    oems: number;
    engineers: number;
  };
}

export interface AdminPlatformUserRow {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  roleLabel: string;
  status: string;
  dateRegistered: string | null;
  dateVerified: string | null;
  country: string | null;
  avatarUrl: string | null;
  metrics: {
    rfqsSent?: number;
    quoteReceived?: number;
    listedProducts?: number;
    totalQuoteSent?: number;
    listingRequest?: number;
    approvedListing?: number;
    productCategory?: string | null;
  };
}

export interface AdminRfqsOrdersSummary {
  rfqs: {
    totalRequests: number;
    totalQuotesSent: number;
  };
  orders: {
    total: number;
    createdPendingPayment: number;
    cancelledPrePayment: number;
    processing: number;
    shipped: number;
    deliveredCompleted: number;
  };
}

export interface AdminRfqRow {
  id: string;
  distributorName: string;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  deliveryTime: string | null;
  status: RfqStatus;
  createdAt: string | null;
}

/**
 * `GET /admin/rfqs/:id` — the admin-wide RFQ detail. Mirrors the buyer-owned
 * `GET /rfqs/:id` shape but is not scoped to the caller.
 */
export interface AdminRfqDetail {
  rfq: Rfq;
  quotes: Quote[];
}

export interface AdminQuoteRow {
  id: string;
  distributorName: string;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  dateReceived: string | null;
  downloadUrl: string | null;
  status?: QuoteStatus;
}

export interface AdminOrderRow {
  id: string;
  distributorName: string;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  date: string | null;
  status: OrderStatus;
}

export interface PlatformSettings {
  _id: string;
  platformFeePercent: number;
  platformFeeCap: number | null;
  autoReceiveDays: number;
  autoReceiveEnabled: boolean;
  subscriptionBillingEnabled: boolean;
  subscriptionGraceDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlatformSettingsPayload {
  platformFeePercent?: number;
  platformFeeCap?: number | null;
  autoReceiveDays?: number;
  autoReceiveEnabled?: boolean;
  subscriptionBillingEnabled?: boolean;
  subscriptionGraceDays?: number;
}

/** Platform-wide escrow figures (GET /admin/escrow/platform). Amounts in kobo. */
export interface PlatformEscrowSummary {
  currency: string;
  platformFeePercent: number;
  platformFeeCap: number | null;
  totalHeldGrossKobo: number;
  totalExpectedNetKobo: number;
  totalPlatformFeeKobo: number;
  totalOrders: number;
}

/**
 * Escrow figures for a single distributor (GET /admin/escrow/distributors/:id).
 * Amounts in kobo.
 */
export interface DistributorEscrowSummary {
  currency: string;
  platformFeePercent: number;
  platformFeeCap: number | null;
  distributor: {
    _id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    businessName: string | null;
  };
  heldGrossKobo: number;
  expectedNetKobo: number;
  platformFeeKobo: number;
  orderCount: number;
}

interface PlatformUserParams {
  role?: UserRole;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  country?: string;
  category?: string;
  page?: number;
  limit?: number;
}

interface AdminTableParams {
  productName?: string;
  distributorName?: string;
  status?: OrderStatus | QuoteStatus | RfqStatus;
  page?: number;
  limit?: number;
}

/** `GET /admin/rfqs` also accepts date-range and party filters. */
interface AdminRfqParams extends AdminTableParams {
  status?: RfqStatus;
  buyerId?: string;
  distributorId?: string;
  /** Inclusive ISO date (or `YYYY-MM-DD`) lower bound on `createdAt`. */
  minDate?: string;
  /** Inclusive upper bound; a bare `YYYY-MM-DD` is widened to end of day. */
  maxDate?: string;
}

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const TRANSIENT_FETCH_RETRY_DELAY_MS = 350;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isNetworkFetchError = (error: unknown): boolean =>
  error instanceof TypeError && error.message.toLowerCase().includes("fetch");

const appendParams = <T extends object>(
  url: URL,
  params: T
) => {
  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value !== "string" && typeof value !== "number")
    ) {
      return;
    }

    url.searchParams.set(key, String(value));
  });
};

const requestJson = async <T>(token: string, path: string): Promise<T> => {
  const requestUrl = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : apiUrl(path);

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method: "GET",
      headers: authHeaders(token),
      cache: "no-store",
    });
  } catch (error) {
    if (!isNetworkFetchError(error)) {
      throw error;
    }

    await delay(TRANSIENT_FETCH_RETRY_DELAY_MS);
    response = await fetch(requestUrl, {
      method: "GET",
      headers: authHeaders(token),
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Admin request failed" }));
    throw new Error(errorPayload.message || "Admin request failed");
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
};

const requestJsonWithBody = async <T>(
  token: string,
  path: string,
  method: "PATCH" | "POST" | "PUT",
  body: unknown,
): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    method,
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Admin request failed" }));
    throw new Error(errorPayload.message || "Admin request failed");
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
};

const adminService = {
  getDashboardSummary(token: string) {
    return requestJson<AdminDashboardSummary>(token, "/admin/dashboard-summary");
  },

  getPlatformUsersSummary(token: string) {
    return requestJson<AdminPlatformUsersSummary>(
      token,
      "/admin/platform-users-summary"
    );
  },

  getPlatformUsers(token: string, params: PlatformUserParams = {}) {
    const url = new URL(apiUrl("/admin/platform-users"));
    appendParams(url, params);
    return requestJson<AdminPagination<AdminPlatformUserRow>>(
      token,
      url.toString()
    );
  },

  getRfqsOrdersSummary(token: string) {
    return requestJson<AdminRfqsOrdersSummary>(
      token,
      "/admin/rfqs-orders-summary"
    );
  },

  getRfqs(token: string, params: AdminRfqParams = {}) {
    const url = new URL(apiUrl("/admin/rfqs"));
    appendParams(url, params);
    return requestJson<AdminPagination<AdminRfqRow>>(
      token,
      url.toString()
    );
  },

  getRfqDetail(token: string, rfqId: string) {
    return requestJson<AdminRfqDetail>(token, `/admin/rfqs/${rfqId}`);
  },

  getQuoteSummary(token: string) {
    return requestJson<QuoteSummary>(token, "/admin/quotes/summary");
  },

  getServiceRequestSummary(token: string) {
    return requestJson<ServiceRequestSummary>(
      token,
      "/admin/service-requests/summary"
    );
  },

  getOrderSummary(token: string) {
    return requestJson<OrderSummary>(token, "/admin/orders/summary");
  },

  getQuotes(token: string, params: AdminTableParams = {}) {
    const url = new URL(apiUrl("/admin/quotes"));
    appendParams(url, params);
    return requestJson<AdminPagination<AdminQuoteRow>>(
      token,
      url.toString()
    );
  },

  getOrders(token: string, params: AdminTableParams = {}) {
    const url = new URL(apiUrl("/admin/orders"));
    appendParams(url, params);
    return requestJson<AdminPagination<AdminOrderRow>>(
      token,
      url.toString()
    );
  },

  getPlatformSettings(token: string) {
    return requestJson<PlatformSettings>(token, "/admin/settings");
  },

  getPlatformEscrow(token: string) {
    return requestJson<PlatformEscrowSummary>(token, "/admin/escrow/platform");
  },

  getDistributorEscrow(token: string, distributorId: string) {
    return requestJson<DistributorEscrowSummary>(
      token,
      `/admin/escrow/distributors/${distributorId}`
    );
  },

  updatePlatformSettings(token: string, payload: UpdatePlatformSettingsPayload) {
    return requestJsonWithBody<PlatformSettings>(
      token,
      "/admin/settings",
      "PATCH",
      payload
    );
  },
};

export default adminService;
