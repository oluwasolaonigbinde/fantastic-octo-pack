"use client";

/**
 * TanStack Query hooks for the orders module — the migration target for the old
 * `store/slices/order-slice.ts` thunk+slice caching layer. Follows the reference
 * pattern in `hooks/queries/products.ts`:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.orders.*`
 *   - writes -> `useMutation` that invalidates the affected keys on success
 *   - the existing `orderService` functions stay untouched as `queryFn` /
 *     `mutationFn`.
 *
 * The auth token still lives in Redux (genuine session state); read hooks pull
 * it from the store and pass it through. It is intentionally NOT part of the key.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/queries/products";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import orderService from "@/services/orderService";
import type {
  DraftOrderUpdate,
  FulfillmentStage,
  Order,
  PayOrderPayload,
} from "@/types/order";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** The list endpoint may return a bare array or a paginated `{ docs }` envelope. */
const normalizeOrdersPayload = (payload: unknown): Order[] => {
  if (Array.isArray(payload)) {
    return payload as Order[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    "docs" in payload &&
    Array.isArray((payload as { docs?: unknown }).docs)
  ) {
    return (payload as { docs: Order[] }).docs;
  }
  return [];
};

/** All orders for the authenticated user (buyer or distributor). */
export const useOrdersQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.orders.list({}),
    queryFn: () => orderService.fetchOrders(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => normalizeOrdersPayload(res.data),
  });
};

/** Single order by id. */
export const useOrderQuery = (
  orderId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? ""),
    queryFn: () => orderService.fetchOrderDetail(token as string, orderId as string),
    enabled: Boolean(token) && Boolean(orderId) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** Escrow summary for the current user (keyed under the wallet namespace). */
export const useEscrowSummaryQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.wallet.escrowSummary(userId ?? "anonymous"),
    queryFn: () => orderService.fetchEscrowSummary(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/** PATCH /orders/:id/draft — buyer edits a draft order before paying. */
export const useUpdateOrderDraftMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: DraftOrderUpdate;
    }) => orderService.updateOrderDraft(token as string, orderId, payload),
    onSuccess: (_res, { orderId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

/** POST /orders/:id/pay — wallet (inline) or Paystack (redirect) payment. */
export const usePayOrderMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: PayOrderPayload;
    }) => orderService.payOrder(token as string, orderId, payload),
    onSuccess: (_res, { orderId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
};

/** POST /orders/:id/received — buyer confirms receipt, releasing escrow. */
export const useConfirmOrderReceiptMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      orderService.markOrderReceived(token as string, orderId),
    onSuccess: (_res, { orderId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
};

/** POST /orders/:id/fulfillment — distributor advances a logistics stage. */
export const useFulfillOrderMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      stage,
    }: {
      orderId: string;
      stage: FulfillmentStage;
    }) => orderService.advanceFulfillment(token as string, orderId, stage),
    onSuccess: (_res, { orderId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};
