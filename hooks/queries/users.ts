"use client";

/**
 * TanStack Query hooks for reading *other* users' public profiles and running
 * directory/search lookups. Auth/session state deliberately stays in Redux
 * (`auth-slice`) — this module is only for fetching profiles we don't own.
 *
 * Reads key off `queryKeys.users.*`. The public profile endpoints are
 * unauthenticated, so no token is threaded through here.
 */

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { userService } from "@/services/userService";
import { UserRole } from "@/types/user";

/** Single public profile by id. */
export const useUserQuery = (
  id: string | undefined,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => userService.getPublicProfileById(id as string),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export interface PublicProfilesQueryParams {
  page?: number;
  limit?: number;
  roles?: Array<UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER>;
  search?: string;
  filters?: {
    minRating?: number;
    specialization?: string;
    equipmentType?: string;
    location?: string;
    availability?: "available" | "busy";
    sortBy?: "name-asc" | "name-desc";
  };
  includeFacets?: boolean;
}

/**
 * Public profile directory / search. Callers pass a params object; each unique
 * params combination is cached independently. Pass `enabled: false` (or an
 * empty `search`) to gate debounced search on a non-empty term.
 */
export const useUsersQuery = (
  params: PublicProfilesQueryParams = {},
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: () =>
      userService.getPublicProfiles(
        params.page,
        params.limit,
        params.roles,
        params.search,
        params.filters,
        params.includeFacets,
      ),
    enabled: options?.enabled ?? true,
    select: (res) => ({ profiles: res.data.docs, meta: res.data }),
  });
