"use client";

/**
 * TanStack Query hooks for the order-disputes module. Follows the products.ts
 * reference template:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.orderDisputes.*`
 *   - writes -> `useMutation` that invalidates the module root on success.
 *     Mutations that change an order's state also invalidate the affected
 *     `queryKeys.orders.detail(orderId)`.
 *   - the existing `orderDisputeService` functions stay untouched and act as the
 *     `queryFn` / `mutationFn`.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import orderDisputeService from "@/services/orderDisputeService";
import type {
  CreateOrderDisputePayload,
  OrderDispute,
  ResolveOrderDisputePayload,
} from "@/types/order-dispute";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/**
 * The list endpoint returns either a plain array or a paginated envelope.
 * Normalize to an `OrderDispute[]` so callers get a stable shape.
 */
const normalizeDisputes = (
  res: Awaited<ReturnType<typeof orderDisputeService.fetchOrderDisputes>>,
): OrderDispute[] => {
  const payload = res.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.docs)) {
    return payload.docs;
  }
  return [];
};

/** The authenticated user's order disputes. */
export const useOrderDisputesQuery = (
  filters: Record<string, unknown> = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.orderDisputes.list(filters),
    queryFn: () => orderDisputeService.fetchOrderDisputes(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: normalizeDisputes,
  });
};

/** Single order dispute by id. */
export const useOrderDisputeQuery = (
  disputeId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.orderDisputes.detail(disputeId ?? ""),
    queryFn: () =>
      orderDisputeService.fetchOrderDisputeById(
        token as string,
        disputeId as string,
      ),
    enabled: Boolean(token) && Boolean(disputeId) && (options?.enabled ?? true),
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export const useCreateOrderDisputeMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
      file,
    }: {
      orderId: string;
      payload: CreateOrderDisputePayload;
      file?: File;
    }) =>
      orderDisputeService.createOrderDispute(
        token as string,
        orderId,
        payload,
        file,
      ),
    onSuccess: (_dispute, { orderId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orderDisputes.all });
      // Raising a dispute freezes the order, so refresh its detail too.
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    },
  });
};

export const useAddOrderDisputeCommentMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, text }: { disputeId: string; text: string }) =>
      orderDisputeService.addOrderDisputeComment(token as string, disputeId, text),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.orderDisputes.all }),
  });
};

export const useAddOrderDisputeEvidenceMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, file }: { disputeId: string; file: File }) =>
      orderDisputeService.addOrderDisputeEvidence(token as string, disputeId, file),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.orderDisputes.all }),
  });
};

export const useRequestOrderDisputeEvidenceMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, note }: { disputeId: string; note?: string }) =>
      orderDisputeService.requestOrderDisputeEvidence(
        token as string,
        disputeId,
        note,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.orderDisputes.all }),
  });
};

export const useResolveOrderDisputeMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      disputeId,
      payload,
    }: {
      disputeId: string;
      payload: ResolveOrderDisputePayload;
    }) =>
      orderDisputeService.resolveOrderDispute(token as string, disputeId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.orderDisputes.all }),
  });
};
