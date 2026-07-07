import type { UserData } from "@/types/user";

/**
 * Team module types, modelled on the `Team`-tagged endpoints of the Baiy API.
 *
 * The owner (a distributor) invites teammates by email, lists their members,
 * toggles seat allocation, and removes members. The invitee accepts a
 * public invitation by setting a password, which creates their member account
 * and logs them in.
 */

/** Whether a member currently occupies a paid seat in the owner's plan. */
export type TeamSeatStatus = "active" | "inactive";

/**
 * A team member as returned by `GET /team/members`.
 *
 * The backend leaves `TeamMemberResponse` undocumented in the OpenAPI spec, so
 * this shape is inferred from the endpoint descriptions (member identity, RBAC
 * role, and seat status). Keep it forgiving and adjust once the real payload is
 * confirmed.
 */
export interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** RBAC role assigned to the member, e.g. "admin". */
  roleName: string;
  /** Whether the member currently holds an active seat. */
  seatStatus: TeamSeatStatus;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Standard `{ success, message, data }` envelope used by team endpoints. */
export interface TeamEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Request body for `POST /team/invites`. */
export interface InviteMemberPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  /** RBAC role to assign. Defaults to "admin" server-side. */
  roleName?: string;
}

/** `data` returned by `POST /team/invites`. */
export interface InviteMemberResult {
  email: string;
}

/** Request body for the public `POST /team/invites/accept`. */
export interface AcceptInvitePayload {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * `data` returned by `POST /team/invites/accept` — the newly created member,
 * already carrying session tokens so the app can log them straight in.
 */
export type AcceptInviteResult = UserData;

/** `data` returned by `DELETE /team/members/{id}`. */
export interface RemoveMemberResult {
  removed: boolean;
}
