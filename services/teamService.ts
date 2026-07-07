import { apiUrl } from "@/utils/api-base-url";
import type {
  AcceptInvitePayload,
  AcceptInviteResult,
  InviteMemberPayload,
  InviteMemberResult,
  RemoveMemberResult,
  TeamEnvelope,
  TeamMember,
} from "@/types/team";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const jsonHeaders = () => ({ "Content-Type": "application/json" });

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
};

const handleResponse = async <T>(
  response: Response,
  fallback: string,
): Promise<TeamEnvelope<T>> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallback));
  }
  return response.json();
};

/* ----------------------------------------------------------------------- */
/* Owner-facing endpoints (distributor with the team:manage permission)    */
/* ----------------------------------------------------------------------- */

/** POST /team/invites — Invite a teammate by email. */
const inviteMember = (
  token: string,
  payload: InviteMemberPayload,
): Promise<TeamEnvelope<InviteMemberResult>> =>
  fetch(apiUrl("/team/invites"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res, "Failed to send invitation"));

/** GET /team/members — List the owner's team members. */
const fetchMembers = (
  token: string,
): Promise<TeamEnvelope<TeamMember[]>> =>
  fetch(apiUrl("/team/members"), {
    method: "GET",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to fetch team members"));

/** POST /team/members/{id}/seat/activate — Reactivate a member's seat. */
const activateSeat = (
  token: string,
  id: string,
): Promise<TeamEnvelope<TeamMember>> =>
  fetch(apiUrl(`/team/members/${id}/seat/activate`), {
    method: "POST",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to activate seat"));

/** POST /team/members/{id}/seat/deactivate — Deactivate a member's seat. */
const deactivateSeat = (
  token: string,
  id: string,
): Promise<TeamEnvelope<TeamMember>> =>
  fetch(apiUrl(`/team/members/${id}/seat/deactivate`), {
    method: "POST",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to deactivate seat"));

/** DELETE /team/members/{id} — Soft-remove a team member. */
const removeMember = (
  token: string,
  id: string,
): Promise<TeamEnvelope<RemoveMemberResult>> =>
  fetch(apiUrl(`/team/members/${id}`), {
    method: "DELETE",
    headers: authHeaders(token),
  }).then((res) => handleResponse(res, "Failed to remove team member"));

/* ----------------------------------------------------------------------- */
/* Public endpoint                                                         */
/* ----------------------------------------------------------------------- */

/** POST /team/invites/accept — Accept an invitation and create the account. */
const acceptInvite = (
  payload: AcceptInvitePayload,
): Promise<TeamEnvelope<AcceptInviteResult>> =>
  fetch(apiUrl("/team/invites/accept"), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res, "Failed to accept invitation"));

export const teamService = {
  inviteMember,
  fetchMembers,
  activateSeat,
  deactivateSeat,
  removeMember,
  acceptInvite,
};

export default teamService;
