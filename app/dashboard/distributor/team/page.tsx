"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import Header from "../../component/header";
import { Button, EmptyState, PageLoader } from "@/components/base";
import { useTeamMembersQuery } from "@/hooks/queries/team";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { TeamMembersTable } from "./_components/team-members-table";

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: members, isLoading, isError, error } = useTeamMembersQuery();

  return (
    <div>
      <Header title="Team" />

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="type-heading-md font-semibold text-gray1">
              Team members
            </h2>
            <p className="type-body-md text-gray2">
              Invite teammates and manage their seats and access.
            </p>
          </div>
          <Button
            title="Invite member"
            size="sm"
            className="w-full sm:w-auto"
            iconLeft={<Users className="size-4" />}
            onClick={() => setInviteOpen(true)}
          />
        </div>

        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <EmptyState
            title="Couldn't load your team"
            description={
              error instanceof Error
                ? error.message
                : "Something went wrong while fetching your team members."
            }
          />
        ) : members && members.length > 0 ? (
          <TeamMembersTable members={members} />
        ) : (
          <EmptyState
            icon={<Users />}
            title="No team members yet"
            description="Invite your first teammate to start collaborating on your account."
          />
        )}
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
