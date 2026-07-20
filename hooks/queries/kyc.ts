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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import kycService, {
  type AdminKycFilters,
  type AdminKycTierFilters,
  type CreateKycSubmissionPayload,
  type MyKycFilters,
} from "@/services/kycService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

const useCurrentUserId = () => useAppSelector((s) => s.auth.data?._id);

/** Poll cadence (ms) while a submission is awaiting review. */
const PENDING_POLL_INTERVAL = 15000;

/** Statuses that mean "an admin still has to act on this". */
const AWAITING_REVIEW_STATUSES = ["submitted", "under_review"] as const;

/**
 * The current user's KYC state: tier definitions + their submissions, fetched
 * together (mirrors the old `Promise.all([getTiers, getSubmissions])`).
 *
 * While any submission is still awaiting review, the query polls every 15s and
 * refetches on window focus so an approval/rejection surfaces without a manual
 * reload — replacing the old hand-rolled interval + focus listeners.
 */
export const useMyKycQuery = (
  filters: MyKycFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: [...queryKeys.kyc.mine(userId ?? "anonymous"), filters],
    queryFn: async () => {
      const [tiersResponse, submissionsResponse] = await Promise.all([
        kycService.getTiers(token as string),
        kycService.getSubmissions(token as string, filters),
      ]);

      return {
        tiers: tiersResponse.data,
        submissions: submissionsResponse.data,
      };
    },
    enabled: Boolean(token) && (options?.enabled ?? true),
    refetchInterval: (query) =>
      (query.state.data?.submissions ?? []).some((submission) =>
        AWAITING_REVIEW_STATUSES.includes(
          submission.status as (typeof AWAITING_REVIEW_STATUSES)[number],
        ),
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
    select: (res) =>
      res.data && "docs" in res.data ? res.data.docs : res.data,
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

/** Full tier catalogue across roles — admin tooling / filter dropdowns. */
export const useAdminKycTiersQuery = (
  filters: AdminKycTierFilters = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: [...queryKeys.kyc.all, "admin-tiers", filters],
    queryFn: () => kycService.getAdminTiers(token as string, filters),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Creates a submission and uploads its files in one multipart request.
 * There is no separate upload step — pass `File` objects in `documents`.
 */
export const useCreateKycSubmissionMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKycSubmissionPayload) =>
      kycService.createSubmission(token as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

/** Admin: move a submission into `under_review`. */
export const useMarkKycUnderReviewMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      kycService.markSubmissionUnderReview(token as string, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

/**
 * Admin: approve a tier.
 *
 * Pass `submissionId` for a review-required tier, or `userId` to grant an
 * `admin_only` tier (Premium *) where the user never submits anything.
 */
export const useApproveKycMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      tierKey,
      submissionId,
      userId,
    }: {
      tierKey: string;
      submissionId?: string;
      userId?: string;
    }) =>
      kycService.approveTier(token as string, tierKey, { submissionId, userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

/** Admin: reject a tier submission with a reason. */
export const useRejectKycMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      tierKey,
      submissionId,
      rejectionReason,
    }: {
      tierKey: string;
      submissionId: string;
      rejectionReason: string;
    }) =>
      kycService.rejectTier(token as string, tierKey, {
        submissionId,
        rejectionReason,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.kyc.all }),
  });
};

export { useCurrentUserId };
