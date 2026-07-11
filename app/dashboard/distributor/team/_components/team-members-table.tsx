"use client";

import { useState } from "react";
import { Loader2Icon, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/base";
import {
  useActivateSeatMutation,
  useDeactivateSeatMutation,
  useRemoveMemberMutation,
} from "@/hooks/queries/team";
import type { TeamMember } from "@/types/team";

const memberName = (member: TeamMember) => {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return name || "—";
};

interface TeamMembersTableProps {
  members: TeamMember[];
}

export function TeamMembersTable({ members }: TeamMembersTableProps) {
  const activateSeat = useActivateSeatMutation();
  const deactivateSeat = useDeactivateSeatMutation();
  const removeMember = useRemoveMemberMutation();

  // Track which member row is mid-mutation so we only spin the acted-on button.
  const [pendingId, setPendingId] = useState<string | null>(null);

  const runAction = async (
    id: string,
    action: () => Promise<unknown>,
  ) => {
    setPendingId(id);
    try {
      await action();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray5 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Seat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isActive = member.seatStatus === "active";
            const isPending = pendingId === member.id;

            return (
              <TableRow key={member.id}>
                <TableCell
                  className="max-w-[200px] truncate font-medium text-gray1"
                  title={memberName(member)}
                >
                  {memberName(member)}
                </TableCell>
                <TableCell className="text-gray2">{member.email}</TableCell>
                <TableCell className="text-gray2">{member.roleName}</TableCell>
                <TableCell>
                  <Badge variant={isActive ? "default" : "outline"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(member.id, () =>
                          isActive
                            ? deactivateSeat.mutateAsync(member.id)
                            : activateSeat.mutateAsync(member.id),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray5 px-3 py-1.5 text-sm text-gray1 transition-colors hover:bg-gray6 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : isActive ? (
                        <ToggleLeft className="size-4" />
                      ) : (
                        <ToggleRight className="size-4" />
                      )}
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(member.id, () =>
                          removeMember.mutateAsync(member.id),
                        )
                      }
                      aria-label={`Remove ${member.email}`}
                      className="inline-flex items-center justify-center rounded-lg border border-danger/25 px-2.5 py-1.5 text-danger transition-colors hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
