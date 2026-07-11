import { apiUrl } from "@/utils/api-base-url";
import type {
  AnalyticsEnvelope,
  AnalyticsQuery,
  DistributorProductAnalytics,
  ProductMetrics,
} from "@/types/analytics";

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

/** GET /analytics/products — Distributor product analytics. */
const fetchProductAnalytics = (
  token: string,
  query: AnalyticsQuery = {},
): Promise<AnalyticsEnvelope<DistributorProductAnalytics>> =>
  fetch(apiUrl(`/analytics/products${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(
        await parseErrorMessage(res, "Failed to fetch product analytics"),
      );
    }
    return res.json();
  });

/** GET /analytics/products/:id — Analytics for one owned product. */
const fetchProductAnalyticsById = (
  token: string,
  productId: string,
  query: AnalyticsQuery = {},
): Promise<AnalyticsEnvelope<ProductMetrics>> =>
  fetch(apiUrl(`/analytics/products/${productId}${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(
        await parseErrorMessage(res, "Failed to fetch product analytics"),
      );
    }
    return res.json();
  });

/** GET /analytics/store — Distributor store-level analytics. */
const fetchStoreAnalytics = (
  token: string,
  query: AnalyticsQuery = {},
): Promise<AnalyticsEnvelope<ProductMetrics>> =>
  fetch(apiUrl(`/analytics/store${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(
        await parseErrorMessage(res, "Failed to fetch store analytics"),
      );
    }
    return res.json();
  });

export const analyticsService = {
  fetchProductAnalytics,
  fetchProductAnalyticsById,
  fetchStoreAnalytics,
};

export default analyticsService;
