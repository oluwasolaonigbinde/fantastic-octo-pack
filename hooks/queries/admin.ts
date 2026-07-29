"use client";

/**
 * TanStack Query hooks for the admin module. Admin dashboards previously called
 * `adminService` directly with `useState`/`useEffect` (plus manual `setInterval`
 * polling and `focus` refetch); those reads move here. The existing
 * `adminService` functions stay untouched and act as the `queryFn`. See
 * `hooks/queries/products.ts` for the reference shape.
 *
 * The admin dashboards intentionally poll, so every read accepts optional
 * `refetchInterval` / `refetchOnWindowFocus` passthroughs — callers opt in to
 * the near-real-time behaviour the old `setInterval` loop provided.
 *
 * NOTE: some admin tables fetch `limit: 1000` client-side. Those are flagged for
 * the server-side pagination follow-up (see the migration README) and are left
 * as-is here — we are replacing the caching layer, not the pagination strategy.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import adminService from "@/services/adminService";
import type { UpdatePlatformSettingsPayload } from "@/services/adminService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** Shared query options exposed by every admin read hook. */
type AdminQueryOptions = {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
};

/** Filter params accepted by the admin table endpoints. */
type AdminTableParams = {
  productName?: string;
  distributorName?: string;
  status?: string;
  page?: number;
  limit?: number;
  /** `GET /admin/rfqs` only: narrow by party and `createdAt` range. */
  buyerId?: string;
  distributorId?: string;
  minDate?: string;
  maxDate?: string;
};

type PlatformUserParams = {
  role?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  country?: string;
  category?: string;
  page?: number;
  limit?: number;
};

const sharedOptions = (token: string | undefined, options?: AdminQueryOptions) => ({
  enabled: Boolean(token) && (options?.enabled ?? true),
  refetchInterval: options?.refetchInterval,
  refetchOnWindowFocus: options?.refetchOnWindowFocus,
});

export const useAdminDashboardSummaryQuery = (options?: AdminQueryOptions) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.dashboardSummary(),
    queryFn: () => adminService.getDashboardSummary(token as string),
    ...sharedOptions(token, options),
  });
};

export const useAdminPlatformUsersSummaryQuery = (
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.platformUsersSummary(),
    queryFn: () => adminService.getPlatformUsersSummary(token as string),
    ...sharedOptions(token, options),
  });
};

export const useAdminPlatformUsersQuery = (
  params: PlatformUserParams = {},
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.platformUsers(params as Record<string, unknown>),
    queryFn: () =>
      adminService.getPlatformUsers(
        token as string,
        params as Parameters<typeof adminService.getPlatformUsers>[1],
      ),
    ...sharedOptions(token, options),
  });
};

export const useAdminRfqsOrdersSummaryQuery = (options?: AdminQueryOptions) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.rfqsOrdersSummary(),
    queryFn: () => adminService.getRfqsOrdersSummary(token as string),
    ...sharedOptions(token, options),
  });
};

export const useAdminRfqsQuery = (
  params: AdminTableParams = {},
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.rfqs(params as Record<string, unknown>),
    queryFn: () =>
      adminService.getRfqs(
        token as string,
        params as Parameters<typeof adminService.getRfqs>[1],
      ),
    ...sharedOptions(token, options),
  });
};

/**
 * `GET /admin/rfqs/:id` — the admin-wide RFQ detail with every quote on it.
 * Unlike `GET /rfqs/:id` this is not scoped to the calling buyer.
 */
export const useAdminRfqDetailQuery = (
  rfqId: string | undefined,
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.rfqDetail(rfqId ?? ""),
    queryFn: () => adminService.getRfqDetail(token as string, rfqId as string),
    ...sharedOptions(token, options),
    enabled: Boolean(token) && Boolean(rfqId) && (options?.enabled ?? true),
  });
};

/** `GET /admin/quotes/summary` — platform-wide quote counters. */
export const useAdminQuoteSummaryQuery = (options?: AdminQueryOptions) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.quoteSummary(),
    queryFn: () => adminService.getQuoteSummary(token as string),
    ...sharedOptions(token, options),
  });
};

/** `GET /admin/service-requests/summary` — platform-wide request counters. */
export const useAdminServiceRequestSummaryQuery = (
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.serviceRequestSummary(),
    queryFn: () => adminService.getServiceRequestSummary(token as string),
    ...sharedOptions(token, options),
  });
};

/**
 * `GET /admin/orders/summary` — platform-wide order counters and value. This is
 * the live replacement for the order half of `/admin/rfqs-orders-summary`,
 * which still hardcodes `processing`, `shipped` and `deliveredCompleted` to 0.
 */
export const useAdminOrderSummaryQuery = (options?: AdminQueryOptions) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.orderSummary(),
    queryFn: () => adminService.getOrderSummary(token as string),
    ...sharedOptions(token, options),
  });
};

export const useAdminQuotesQuery = (
  params: AdminTableParams = {},
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.quotes(params as Record<string, unknown>),
    queryFn: () =>
      adminService.getQuotes(
        token as string,
        params as Parameters<typeof adminService.getQuotes>[1],
      ),
    ...sharedOptions(token, options),
  });
};

export const useAdminOrdersQuery = (
  params: AdminTableParams = {},
  options?: AdminQueryOptions,
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.orders(params as Record<string, unknown>),
    queryFn: () =>
      adminService.getOrders(
        token as string,
        params as Parameters<typeof adminService.getOrders>[1],
      ),
    ...sharedOptions(token, options),
  });
};

/**
 * Platform settings (fees, auto-receive window, subscription billing). Buyer and
 * distributor order screens read the auto-receive window from here to drive the
 * escrow countdown, so this is not admin-only in practice — but the endpoint may
 * still reject non-admin callers, hence `retry: false` and no throwing consumer.
 */
export const useAdminPlatformSettingsQuery = (options?: AdminQueryOptions) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: () => adminService.getPlatformSettings(token as string),
    retry: false,
    staleTime: 5 * 60_000,
    ...sharedOptions(token, options),
  });
};

export const useUpdateAdminPlatformSettingsMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePlatformSettingsPayload) =>
      adminService.updatePlatformSettings(token as string, payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.admin.settings(), data);
    },
  });
};
