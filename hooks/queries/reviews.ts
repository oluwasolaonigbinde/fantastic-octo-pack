"use client";

/**
 * TanStack Query hooks for the reviews module. See `hooks/queries/products.ts`
 * for the reference shape. The existing `reviewService` functions stay untouched
 * and act as the `queryFn` / `mutationFn`.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import {
  reviewService,
  type CreateReviewPayload,
} from "@/services/reviewService";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** Public list of reviews for an engineer. */
export const useEngineerReviewsQuery = (
  engineerId: string | undefined,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.reviews.forEngineer(engineerId ?? ""),
    queryFn: () => reviewService.getEngineerReviews(engineerId as string),
    enabled: Boolean(engineerId) && (options?.enabled ?? true),
  });

/** The current user's review for a given service request (null if none). */
export const useReviewForServiceRequestQuery = (
  serviceRequestId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.reviews.forServiceRequest(serviceRequestId ?? ""),
    queryFn: () =>
      reviewService.getReviewForServiceRequest(
        token as string,
        serviceRequestId as string,
      ),
    enabled:
      Boolean(token) &&
      Boolean(serviceRequestId) &&
      (options?.enabled ?? true),
  });
};

/**
 * Submit a review for a completed service request. Invalidates the reviews root
 * so the engineer's list and the service-request check refetch.
 */
export const useSubmitReviewMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      reviewService.createReview(token as string, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
};
