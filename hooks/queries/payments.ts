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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import paymentService from "@/services/paymentService";
import type {
  AllPaymentsQuery,
  BanksQuery,
  MyPaymentsQuery,
  PaymentListPagination,
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

/**
 * Banks supported by the payment gateway. The list is effectively static, so it
 * is cached for the session and shared by every role's payout dialog.
 */
export const useBanksQuery = (
  query: BanksQuery = { currency: "NGN", country: "nigeria" },
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.payments.banks({ ...query }),
    queryFn: () => paymentService.fetchBanks(token as string, query),
    enabled: Boolean(token) && (options?.enabled ?? true),
    staleTime: Infinity,
  });
};

/** Read the pagination envelope, synthesising one when the API returns a bare array. */
const normalizePagination = (
  res: PaymentListResponse,
  limit: number,
): PaymentListPagination => {
  const data = res.data as unknown;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "docs" in data
  ) {
    return data as PaymentListPagination;
  }

  const docs = Array.isArray(data) ? (data as PaymentTransaction[]) : [];
  return {
    docs,
    totalDocs: docs.length,
    limit: limit || docs.length || 20,
    totalPages: 1,
    page: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  };
};

/**
 * Admin payout (withdrawal) requests. Forces `intent=withdrawal` and returns
 * the raw pagination envelope so the payout screen can drive its own pager.
 */
export const useWithdrawalRequestsQuery = (
  query: Omit<AllPaymentsQuery, "intent"> = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();
  const merged: AllPaymentsQuery = { ...query, intent: "withdrawal" };

  return useQuery({
    queryKey: queryKeys.payments.withdrawals({ ...merged }),
    queryFn: () => paymentService.fetchPayments(token as string, merged),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => ({
      page: normalizePagination(res, merged.limit ?? 20),
      message: res.message,
    }),
  });
};

/** Approve a pending payout, then refresh every payout/payment view. */
export const useApproveWithdrawalMutation = () => {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      paymentService.approveWithdrawal(token as string, transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
};

/** Reject a pending payout with an optional note, then refresh payout views. */
export const useRejectWithdrawalMutation = () => {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      note,
    }: {
      transactionId: string;
      note?: string;
    }) => paymentService.rejectWithdrawal(token as string, transactionId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
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
