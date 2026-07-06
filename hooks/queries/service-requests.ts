"use client";

/**
 * TanStack Query hooks for the service-requests module. Follows the products.ts
 * reference template:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.serviceRequests.*`
 *   - writes -> `useMutation` that invalidates the module root on success
 *   - the existing `serviceRequestService` functions stay untouched and act as
 *     the `queryFn` / `mutationFn`.
 *
 * Buyer and engineer both hit `GET /service-requests` (the backend scopes the
 * result by the caller's role from the token). They map onto the `buyer` /
 * `engineer` query keys so each dashboard caches independently.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import serviceRequestService from "@/services/serviceRequestService";
import type {
  CreateServiceRequestPayload,
  ServiceRequestStatus,
  UpdateServiceRequestStatusPayload,
} from "@/types/service-request";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

export type ServiceRequestFilters = {
  page?: number;
  limit?: number;
  status?: ServiceRequestStatus;
};

const selectList = (res: Awaited<
  ReturnType<typeof serviceRequestService.fetchServiceRequests>
>) => ({
  requests: res.data.docs,
  statusCounts: res.data.statusCounts ?? null,
  meta: res.data,
  message: res.message,
});

/** The buyer's service requests. */
export const useBuyerServiceRequestsQuery = (
  filters: ServiceRequestFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.serviceRequests.buyer(filters),
    queryFn: () =>
      serviceRequestService.fetchServiceRequests(token as string, filters),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: selectList,
  });
};

/** Service requests assigned to the current engineer. */
export const useEngineerServiceRequestsQuery = (
  filters: ServiceRequestFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.serviceRequests.engineer(filters),
    queryFn: () =>
      serviceRequestService.fetchServiceRequests(token as string, filters),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: selectList,
  });
};

/** Single service request by id. */
export const useServiceRequestQuery = (
  id: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.serviceRequests.detail(id ?? ""),
    queryFn: () =>
      serviceRequestService.fetchServiceRequestById(token as string, id as string),
    enabled: Boolean(token) && Boolean(id) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export const useCreateServiceRequestMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequestPayload | FormData) =>
      serviceRequestService.createServiceRequest(token as string, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceRequests.all }),
  });
};

export const useUpdateServiceRequestStatusMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateServiceRequestStatusPayload;
    }) =>
      serviceRequestService.updateServiceRequestStatus(
        token as string,
        id,
        payload,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceRequests.all }),
  });
};

export const useBuyerMarkCompletedMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      serviceRequestService.buyerMarkCompleted(token as string, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.serviceRequests.all }),
  });
};
