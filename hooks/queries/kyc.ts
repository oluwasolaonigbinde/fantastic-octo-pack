"use client";

/**
 * TanStack Query hooks for the KYC module. `kycService` had no Redux slice —
 * components fetched it directly with `useState`/`useEffect`. These hooks
 * replace that hand-rolled loading/error state.
 *
 * Reads key off `queryKeys.kyc.*`; mutations invalidate `queryKeys.kyc.all`
 * so any mounted submitter / admin view refetches with fresh data. The auth
 * token still lives in Redux and is read here and passed to the service.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import kycService, {
  type AdminKycFilters,
  type CreateKycSubmissionPayload,
} from "@/services/kycService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

const useCurrentUserId = () => useAppSelector((s) => s.auth.data?._id);

/** Poll cadence (ms) while a submission is awaiting review. */
const PENDING_POLL_INTERVAL = 15000;

/**
 * The current user's KYC state: tier definitions + their submissions, fetched
 * together (mirrors the old `Promise.all([getTiers, getSubmissions])`).
 *
 * While any submission is still `submitted` (awaiting review), the query polls
 * every 15s and refetches on window focus so an approval/rejection surfaces
 * without a manual reload — replacing the old hand-rolled interval + focus
 * listeners.
 */
export const useMyKycQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.kyc.mine(userId ?? "anonymous"),
    queryFn: async () => {
      const [tiersResponse, submissionsResponse] = await Promise.all([
        kycService.getTiers(token as string),
        kycService.getSubmissions(token as string),
      ]);

      return {
        tiers: tiersResponse.data,
        submissions: submissionsResponse.data,
      };
    },
    enabled: Boolean(token) && (options?.enabled ?? true),
    refetchInterval: (query) =>
      (query.state.data?.submissions ?? []).some(
        (submission) => submission.status === "submitted",
      )
        ? PENDING_POLL_INTERVAL
        : false,
    refetchOnWindowFocus: true,
  });
};

/** Admin submissions list (paginated envelope or bare array is normalised). */
export const useAdminKycListQuery = (
  filters: AdminKycFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.kyc.adminList(filters as Record<string, unknown>),
    queryFn: () => kycService.getAdminSubmissions(token as string, filters),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => ("docs" in res.data ? res.data.docs : res.data),
  });
};

/** Admin KYC summary cards. */
export const useAdminKycStatsQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: [...queryKeys.kyc.all, "admin-stats"],
    queryFn: () => kycService.getAdminStats(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** Single admin submission detail (drawer). */
export const useAdminKycDetailQuery = (
  id: string | null | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.kyc.adminDetail(id ?? ""),
    queryFn: () => kycService.getAdminSubmission(token as string, id as string),
    enabled: Boolean(token) && Boolean(id) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/** Upload a single KYC document. Does not touch the cache on its own. */
export const useUploadKycDocumentMutation = () => {
  const token = useAuthToken();

  return useMutation({
    mutationFn: (file: File) => kycService.uploadDocument(token as string, file),
  });
};

export const useCreateKycSubmissionMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKycSubmissionPayload) =>
      kycService.createSubmission(token as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

export const useApproveKycMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      kycService.approveAdminSubmission(token as string, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

export const useRejectKycMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      kycService.rejectAdminSubmission(token as string, id, rejectionReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

export { useCurrentUserId };
