"use client";

/**
 * TanStack Query hooks for the RFQ module. Reads use `useQuery`, writes use
 * `useMutation` that invalidate `queryKeys.rfqs.all` on success so any mounted
 * buyer list / detail / distributor inbox refetches with fresh data.
 *
 * The existing `rfqService` functions stay untouched and act as the
 * `queryFn` / `mutationFn`. The auth token lives in Redux (session state), so
 * hooks pull it from the store and pass it through; it is not part of the key.
 * Follows the products reference template.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/queries/products";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import rfqService from "@/services/rfqService";
import type { RfqListFilters } from "@/types/rfq";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/**
 * Every RFQ/quote list renders newest first — a buyer or seller opening the
 * hub must see the request that just came in, not the oldest one. The API is
 * not consistent about this (the RFQ detail read returns quotes in insertion
 * order, i.e. oldest first), so ordering is enforced here in `select` and
 * every consumer of these hooks inherits it.
 */
const newestFirst = <T>(items: T[] | undefined, at: (item: T) => string | undefined) =>
  [...(items ?? [])].sort(
    (a, b) => new Date(at(b) ?? 0).getTime() - new Date(at(a) ?? 0).getTime(),
  );

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

/**
 * RFQs raised by the signed-in buyer. Returns `Rfq[]` via `select`. `filters`
 * is forwarded to `GET /rfqs` (status + `createdAt` range) and is part of the
 * key, so each filter combination caches separately.
 */
export const useBuyerRfqsQuery = (
  filters: RfqListFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.rfqs.list({ scope: "buyer", ...filters }),
    queryFn: () => rfqService.fetchBuyerRfqs(token as string, filters),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => newestFirst(res.data, (rfq) => rfq.createdAt),
  });
};

/**
 * `GET /rfqs/quotes/summary` — counters across every quote on the buyer's RFQs.
 * Cheaper and more accurate than counting a fetched quote list client-side,
 * which only ever sees the page the buyer has loaded.
 */
export const useBuyerQuoteSummaryQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.rfqs.buyerQuoteSummary(userId ?? ""),
    queryFn: () => rfqService.fetchBuyerQuoteSummary(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** `GET /rfqs/inbox/quotes/summary` — counters for the distributor's inbox. */
export const useDistributorQuoteSummaryQuery = (options?: {
  enabled?: boolean;
}) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.rfqs.distributorQuoteSummary(userId ?? ""),
    queryFn: () => rfqService.fetchDistributorQuoteSummary(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** Quote requests in the signed-in distributor's inbox. Returns `Quote[]`. */
export const useDistributorInboxQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.rfqs.list({ scope: "distributor-inbox" }),
    queryFn: () => rfqService.fetchDistributorInbox(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    // Ordered on the request date the inbox actually shows (the RFQ's), not the
    // quote row's, so the list matches its own "Request date" column.
    select: (res) =>
      newestFirst(res.data, (quote) =>
        typeof quote.rfq === "string" ? quote.createdAt : quote.rfq?.createdAt ?? quote.createdAt,
      ),
  });
};

/** A single RFQ with its quotes. Returns the `RfqDetailResponse` via `select`. */
export const useRfqDetailQuery = (
  rfqId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.rfqs.detail(rfqId ?? ""),
    queryFn: () => rfqService.fetchRfqDetail(token as string, rfqId as string),
    enabled: Boolean(token) && Boolean(rfqId) && (options?.enabled ?? true),
    select: (res) => ({
      ...res.data,
      quotes: newestFirst(res.data?.quotes, (quote) => quote.createdAt),
    }),
  });
};

/**
 * The RFQ list deliberately stays lightweight. The buyer hub uses this small
 * batch of existing detail reads to render returned quote price/status data in
 * the Figma table without relying on an undocumented aggregate endpoint.
 */
export const useBuyerRfqDetails = (rfqIds: string[]) => {
  const token = useAuthToken();

  return useQueries({
    queries: rfqIds.slice(0, 25).map((rfqId) => ({
      queryKey: queryKeys.rfqs.detail(rfqId),
      queryFn: () => rfqService.fetchRfqDetail(token as string, rfqId),
      enabled: Boolean(token) && Boolean(rfqId),
      select: (res: Awaited<ReturnType<typeof rfqService.fetchRfqDetail>>) => ({
        ...res.data,
        quotes: newestFirst(res.data?.quotes, (quote) => quote.createdAt),
      }),
    })),
  });
};

/** Answered quotes across every RFQ the buyer raised (`/rfqs/quotes/received`). */
export const useBuyerReceivedQuotesQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.rfqs.list({ scope: "buyer-received-quotes" }),
    queryFn: () => rfqService.fetchBuyerReceivedQuotes(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => newestFirst(res.data, (quote) => quote.createdAt),
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every mutation invalidates the RFQ root key on success so any mounted buyer
 * list, RFQ detail, or distributor inbox refetches with fresh data.
 */
export const useCreateRfqMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      attachments,
    }: {
      data: Parameters<typeof rfqService.createRfq>[1];
      attachments?: File[];
    }) => rfqService.createRfq(token as string, data, attachments),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};

/**
 * Email-targeted bulk submit. Unlike the single flow there is no separate
 * submit call — the backend routes each row to the named distributor straight
 * away — so the caller only has to surface `data.errors` for skipped rows.
 */
export const useCreateBulkRfqMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof rfqService.createBulkRfq>[1]) =>
      rfqService.createBulkRfq(token as string, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};

export const useRespondToQuoteMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      quoteId,
      data,
      files,
    }: {
      quoteId: string;
      data: Parameters<typeof rfqService.respondToQuote>[2];
      files?: Parameters<typeof rfqService.respondToQuote>[3];
    }) => rfqService.respondToQuote(token as string, quoteId, data, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};

export const useApproveQuoteMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) =>
      rfqService.approveQuote(token as string, quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};

/** Declines a quoted offer; the RFQ stays open for the other distributors. */
export const useRejectQuoteMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason?: string }) =>
      rfqService.rejectQuote(token as string, quoteId, reason ? { reason } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};

/** Nudges distributors who have not answered yet. Reads stay valid, so no invalidate. */
export const useSendRfqReminderMutation = () => {
  const token = useAuthToken();

  return useMutation({
    mutationFn: ({ rfqId, distributorId }: { rfqId: string; distributorId?: string }) =>
      rfqService.sendRfqReminder(token as string, rfqId, distributorId),
  });
};
