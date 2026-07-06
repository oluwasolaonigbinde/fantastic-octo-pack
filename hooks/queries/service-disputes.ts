"use client";

/**
 * TanStack Query hooks for the service-disputes module. Reads move here from the
 * page-local `useState`/`useEffect` fetches; the existing
 * `serviceDisputeService` functions stay untouched and act as the
 * `queryFn` / `mutationFn`. See `hooks/queries/products.ts` for the reference
 * shape.
 *
 * Both the admin console and the buyer service-request drawer consume this
 * module, so the `scope` ("admin" | "me") is part of the query key — the admin
 * endpoints and the buyer endpoints return different visibility of the same
 * records. Mutations invalidate the module root so every mounted list/detail
 * refetches with fresh data.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import { serviceDisputeService } from "@/services/serviceDisputeService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** List of service disputes. `admin` pulls the admin-scoped endpoint. */
export const useServiceDisputesQuery = (
  admin = false,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.serviceDisputes.list(admin ? "admin" : "me"),
    queryFn: () =>
      serviceDisputeService.fetchServiceDisputes(token as string, admin),
    enabled: Boolean(token) && (options?.enabled ?? true),
  });
};

/** Single service dispute by id. */
export const useServiceDisputeQuery = (
  disputeId: string | undefined,
  admin = false,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.serviceDisputes.detail(
      disputeId ?? "",
      admin ? "admin" : "me",
    ),
    queryFn: () =>
      serviceDisputeService.fetchServiceDisputeById(
        token as string,
        disputeId as string,
        admin,
      ),
    enabled: Boolean(token) && Boolean(disputeId) && (options?.enabled ?? true),
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every mutation invalidates the service-disputes root key on success so any
 * mounted list/detail refetches. Consumers that also need to refresh the parent
 * service request should invalidate `queryKeys.serviceRequests.all` from their
 * own success handler (the two modules share the buyer drawer).
 */
export const useCreateServiceDisputeMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceRequestId,
      payload,
    }: {
      serviceRequestId: string;
      payload: { reason: string; description: string } | FormData;
    }) =>
      serviceDisputeService.createServiceDispute(
        token as string,
        serviceRequestId,
        payload,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceDisputes.all }),
  });
};

export const useAddServiceDisputeCommentMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, text }: { disputeId: string; text: string }) =>
      serviceDisputeService.addServiceDisputeComment(
        token as string,
        disputeId,
        text,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceDisputes.all }),
  });
};

export const useAddServiceDisputeEvidenceMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, file }: { disputeId: string; file: File }) =>
      serviceDisputeService.addServiceDisputeEvidence(
        token as string,
        disputeId,
        file,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceDisputes.all }),
  });
};

export const useRequestServiceDisputeEvidenceMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, note }: { disputeId: string; note?: string }) =>
      serviceDisputeService.requestServiceDisputeEvidence(
        token as string,
        disputeId,
        note,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceDisputes.all }),
  });
};

export const useResolveServiceDisputeMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      disputeId,
      payload,
    }: {
      disputeId: string;
      payload: { resolutionOutcome: string; resolutionNote?: string };
    }) =>
      serviceDisputeService.resolveServiceDispute(
        token as string,
        disputeId,
        payload,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceDisputes.all }),
  });
};
