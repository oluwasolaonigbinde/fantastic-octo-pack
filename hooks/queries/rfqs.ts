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
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import rfqService from "@/services/rfqService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

/** RFQs raised by the signed-in buyer. Returns `Rfq[]` via `select`. */
export const useBuyerRfqsQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.rfqs.list({ scope: "buyer" }),
    queryFn: () => rfqService.fetchBuyerRfqs(token as string),
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
    select: (res) => res.data,
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
    select: (res) => res.data,
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

export const useSelectQuoteMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) =>
      rfqService.selectQuote(token as string, quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rfqs.all }),
  });
};
