import { apiUrl } from "@/utils/api-base-url";
import type {
  AdminFeaturesQuery,
  AdminInvoicesQuery,
  AdminPlansQuery,
  AdminSubscriptionsQuery,
  CreatePlanPayload,
  FeatureDefinition,
  Invoice,
  MyInvoicesQuery,
  MySubscription,
  PlansQuery,
  SubscribePayload,
  SubscribeResult,
  Subscription,
  SubscriptionEnvelope,
  SubscriptionPage,
  SubscriptionPlan,
  UpdatePlanPayload,
} from "@/types/subscription";

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

const handleResponse = async <T>(
  response: Response,
  fallback: string,
): Promise<SubscriptionEnvelope<T>> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallback));
  }
  return response.json();
};

/* ----------------------------------------------------------------------- */
/* Caller-facing endpoints (distributors and other subscribing roles)      */
/* ----------------------------------------------------------------------- */

/** GET /subscriptions/plans — List subscription plans available to the caller. */
const fetchPlans = (
  token: string,
  query: PlansQuery = {},
): Promise<SubscriptionEnvelope<SubscriptionPage<SubscriptionPlan>>> =>
  fetch(apiUrl(`/subscriptions/plans${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch subscription plans"));

/** GET /subscriptions/me — Get the caller's subscription and resolved entitlements. */
const fetchMySubscription = (
  token: string,
): Promise<SubscriptionEnvelope<MySubscription>> =>
  fetch(apiUrl("/subscriptions/me"), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch subscription"));

/** GET /subscriptions/me/invoices — List the caller's invoices. */
const fetchMyInvoices = (
  token: string,
  query: MyInvoicesQuery = {},
): Promise<SubscriptionEnvelope<SubscriptionPage<Invoice>>> =>
  fetch(apiUrl(`/subscriptions/me/invoices${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch invoices"));

/** POST /subscriptions/subscribe — Subscribe to a plan. */
const subscribe = (
  token: string,
  payload: SubscribePayload,
): Promise<SubscriptionEnvelope<SubscribeResult>> =>
  fetch(apiUrl("/subscriptions/subscribe"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res, "Failed to subscribe to plan"));

/** POST /subscriptions/pay — Retry collection on the caller's open invoice. */
const payOpenInvoice = (
  token: string,
): Promise<SubscriptionEnvelope<Invoice>> =>
  fetch(apiUrl("/subscriptions/pay"), {
    method: "POST",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to pay invoice"));

/** POST /subscriptions/cancel — Cancel the caller's subscription at period end. */
const cancelSubscription = (
  token: string,
): Promise<SubscriptionEnvelope<Subscription>> =>
  fetch(apiUrl("/subscriptions/cancel"), {
    method: "POST",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to cancel subscription"));

/* ----------------------------------------------------------------------- */
/* Admin endpoints                                                         */
/* ----------------------------------------------------------------------- */

/** GET /subscriptions/admin/features — List the feature catalog (admin). */
const fetchFeatureCatalog = (
  token: string,
  query: AdminFeaturesQuery = {},
): Promise<SubscriptionEnvelope<{ docs: FeatureDefinition[] }>> =>
  fetch(apiUrl(`/subscriptions/admin/features${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch feature catalog"));

/** POST /subscriptions/admin/plans — Create a plan (admin). */
const createPlan = (
  token: string,
  payload: CreatePlanPayload,
): Promise<SubscriptionEnvelope<SubscriptionPlan>> =>
  fetch(apiUrl("/subscriptions/admin/plans"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res, "Failed to create plan"));

/** GET /subscriptions/admin/plans — List plans (admin). */
const fetchAdminPlans = (
  token: string,
  query: AdminPlansQuery = {},
): Promise<SubscriptionEnvelope<SubscriptionPage<SubscriptionPlan>>> =>
  fetch(apiUrl(`/subscriptions/admin/plans${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch plans"));

/** GET /subscriptions/admin/plans/{id} — Get a plan (admin). */
const fetchAdminPlan = (
  token: string,
  id: string,
): Promise<SubscriptionEnvelope<SubscriptionPlan>> =>
  fetch(apiUrl(`/subscriptions/admin/plans/${id}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch plan"));

/** PATCH /subscriptions/admin/plans/{id} — Update a plan (admin). */
const updatePlan = (
  token: string,
  id: string,
  payload: UpdatePlanPayload,
): Promise<SubscriptionEnvelope<SubscriptionPlan>> =>
  fetch(apiUrl(`/subscriptions/admin/plans/${id}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res, "Failed to update plan"));

/** GET /subscriptions/admin/subscriptions — List subscriptions (admin). */
const fetchAdminSubscriptions = (
  token: string,
  query: AdminSubscriptionsQuery = {},
): Promise<SubscriptionEnvelope<SubscriptionPage<Subscription>>> =>
  fetch(apiUrl(`/subscriptions/admin/subscriptions${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch subscriptions"));

/** GET /subscriptions/admin/invoices — List invoices (admin). */
const fetchAdminInvoices = (
  token: string,
  query: AdminInvoicesQuery = {},
): Promise<SubscriptionEnvelope<SubscriptionPage<Invoice>>> =>
  fetch(apiUrl(`/subscriptions/admin/invoices${buildQuery(query)}`), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch invoices"));

export const subscriptionService = {
  // caller-facing
  fetchPlans,
  fetchMySubscription,
  fetchMyInvoices,
  subscribe,
  payOpenInvoice,
  cancelSubscription,
  // admin
  fetchFeatureCatalog,
  createPlan,
  fetchAdminPlans,
  fetchAdminPlan,
  updatePlan,
  fetchAdminSubscriptions,
  fetchAdminInvoices,
};

export default subscriptionService;
