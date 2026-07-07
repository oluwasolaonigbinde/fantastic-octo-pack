"use client";

/**
 * TanStack Query hooks for the Team module. Mirrors the shape of
 * `hooks/queries/subscription.ts`:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.team.*`
 *   - writes -> `useMutation` that invalidates `queryKeys.team.all`
 *
 * All owner-facing endpoints require the caller's access token. The public
 * accept-invite flow lives on the page itself (no token) and dispatches
 * `setUser` to log the new member in.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import teamService from "@/services/teamService";
import { setUser } from "@/store/slices/auth-slice";
import type { AcceptInvitePayload, InviteMemberPayload } from "@/types/team";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** The owner's team members. */
export const useTeamMembersQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.team.members(),
    queryFn: () => teamService.fetchMembers(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export const useInviteMemberMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      teamService.inviteMember(token as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team.all }),
  });
};

export const useActivateSeatMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      teamService.activateSeat(token as string, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team.all }),
  });
};

export const useDeactivateSeatMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      teamService.deactivateSeat(token as string, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team.all }),
  });
};

export const useRemoveMemberMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      teamService.removeMember(token as string, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.team.all }),
  });
};

/**
 * Public invitation acceptance. On success the returned member (which carries
 * session tokens) is written into the auth store, logging the new member in.
 */
export const useAcceptInviteMutation = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: AcceptInvitePayload) =>
      teamService.acceptInvite(payload),
    onSuccess: (res) => {
      dispatch(setUser(res.data));
    },
  });
};
