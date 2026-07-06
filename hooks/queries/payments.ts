"use client";

/**
 * TanStack Query hooks for the payments module. Reads move here from the
 * `payment-slice` thunks; the imperative bank lookups (`fetchBanks`,
 * `resolveBankAccount`) stay on `paymentService` and are called directly from
 * the payout UI. See `hooks/queries/products.ts` for the reference shape.
 *
 * There is no dedicated payment mutation on `paymentService` — payments change
 * order/wallet state through the order-slice `payOrder` flow. When that flow is
 * migrated, its mutation should invalidate `queryKeys.payments.all` alongside
 * `queryKeys.orders.all` / `queryKeys.wallet.all`.
 */

import { useQuery } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import paymentService from "@/services/paymentService";
import type {
  AllPaymentsQuery,
  MyPaymentsQuery,
  PaymentListResponse,
  PaymentTransaction,
} from "@/types/payment";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** Pull the transaction array out of whatever envelope shape the API returns. */
const normalizePayments = (
  res: PaymentListResponse,
): PaymentTransaction[] => {
  const data = res.data as unknown;
  if (Array.isArray(data)) return data as PaymentTransaction[];
  if (
    data &&
    typeof data === "object" &&
    "docs" in data &&
    Array.isArray((data as { docs?: unknown }).docs)
  ) {
    return (data as { docs: PaymentTransaction[] }).docs;
  }
  return [];
};

/** The authenticated user's transactions. Mirrors `state.payment.myPayments`. */
export const useMyPaymentsQuery = (
  query: MyPaymentsQuery = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.payments.list({ scope: "me", ...query }),
    queryFn: () => paymentService.fetchMyPayments(token as string, query),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => ({
      payments: normalizePayments(res),
      message: res.message,
    }),
  });
};

/** All transactions (admin). Mirrors the old `state.payment.payments`. */
export const useAllPaymentsQuery = (
  query: AllPaymentsQuery = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.payments.list({ scope: "all", ...query }),
    queryFn: () => paymentService.fetchPayments(token as string, query),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => ({
      payments: normalizePayments(res),
      message: res.message,
    }),
  });
};
