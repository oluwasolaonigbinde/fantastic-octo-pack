"use client";

/**
 * Grants an `admin_only` verification tier (the Premium * tiers).
 *
 * These tiers have no user-facing submission path at all — the only way one is
 * ever awarded is `PATCH /kyc/admin/tiers/:tierKey/approve` with a `userId`
 * instead of a `submissionId`. The server then synthesises an approved
 * submission and recomputes the user's `kycLevel`.
 *
 * Server-side guards this dialog has to surface (see `service.ts:827`):
 *   - tier must be `admin_only` — otherwise `submissionId` is required
 *   - `prerequisiteTierKey` must already be approved for that user
 *   - the tier must not already be approved for that user
 */

import { useMemo, useState } from "react";
import { AlertCircle, Search, Star } from "lucide-react";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, SingleSelect, Spinner } from "@/components/base";
import {
  getKycTiersForRole,
  isKycSubmitterRole,
  KYC_SUBMITTER_ROLES,
} from "@/constants/kycTiers";
import { useAdminPlatformUsersQuery } from "@/hooks/queries/admin";
import { useApproveKycMutation } from "@/hooks/queries/kyc";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/user";

const ROLE_LABELS: Record<string, string> = {
  [UserRole.BUYER]: "Buyer",
  [UserRole.DISTRIBUTOR]: "Distributor",
  [UserRole.OEM]: "OEM",
  [UserRole.ENGINEER]: "Service Engineer",
};

export default function AdminKycPremiumGrant({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [role, setRole] = useState<string>(UserRole.DISTRIBUTOR);
  const [tierKey, setTierKey] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<string | null>(null);

  const approve = useApproveKycMutation();

  const tiersForRole = useMemo(
    () =>
      isKycSubmitterRole(role)
        ? getKycTiersForRole(role).filter(
            (tier) => tier.submissionBehavior === "admin_only",
          )
        : [],
    [role],
  );

  // Only query once there's something to search — avoids pulling every user.
  const usersQuery = useAdminPlatformUsersQuery(
    { role: role as UserRole, search: search.trim(), limit: 8 },
    { enabled: open && search.trim().length >= 2 },
  );

  const users = usersQuery.data?.docs ?? [];
  const selectedTier = tiersForRole.find((tier) => tier.tierKey === tierKey) ?? null;
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const reset = () => {
    setTierKey("");
    setSearch("");
    setSelectedUserId(null);
    setError(null);
    setGranted(null);
  };

  const handleGrant = async () => {
    if (!selectedTier || !selectedUserId || approve.isPending) return;

    setError(null);

    try {
      await approve.mutateAsync({
        tierKey: selectedTier.tierKey,
        userId: selectedUserId,
      });
      setGranted(selectedTier.tierLabel);
    } catch (grantError) {
      setError(
        grantError instanceof Error
          ? grantError.message
          : "Unable to grant this verification tier",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (approve.isPending) return;
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="w-[92vw] max-w-[480px] rounded-[12px] bg-white p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-left text-[15px] font-medium leading-6 text-black">
            <Star size={16} className="text-[#F59E0B]" />
            Grant premium recognition
          </DialogTitle>
        </DialogHeader>

        {granted ? (
          <div className="mt-4 text-center">
            <p className="text-[14px] font-medium text-black">{granted} granted</p>
            <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
              The user&apos;s account tier has been updated.
            </p>
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
              className="mt-4 h-[42px] w-full rounded-[8px] bg-[#0669D9] text-[14px] text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-[8px] bg-[#F9FAFB] p-3 text-[12px] leading-4 text-[#4B5563]">
              Premium tiers have no application flow — they are awarded here only.
              The user must already hold the tier below it.
            </p>

            <SingleSelect
              label="Account type"
              value={role}
              options={KYC_SUBMITTER_ROLES.filter(
                // Buyer has no admin_only tier.
                (candidate) => candidate !== UserRole.BUYER,
              ).map((candidate) => ({
                label: ROLE_LABELS[candidate] ?? candidate,
                value: candidate,
              }))}
              onValueChange={(next) => {
                setRole(next);
                setTierKey("");
                setSelectedUserId(null);
              }}
            />

            <SingleSelect
              label="Tier"
              placeholder="Select a premium tier"
              value={tierKey}
              options={tiersForRole.map((tier) => ({
                label: tier.tierLabel,
                value: tier.tierKey,
              }))}
              onValueChange={setTierKey}
            />

            <div>
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-[38px] text-[#9CA3AF]"
                />
                <Input
                  label="User"
                  value={search}
                  placeholder="Search by name or email"
                  className="pl-9"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedUserId(null);
                  }}
                />
              </div>

              {search.trim().length >= 2 ? (
                <div className="mt-2 max-h-[168px] overflow-y-auto rounded-[8px] border border-[#EEF0F3]">
                  {usersQuery.isLoading ? (
                    <p className="p-3 text-[12px] text-[#6B7280]">Searching...</p>
                  ) : users.length ? (
                    users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 border-b border-[#F1F3F5] px-3 py-2 text-left last:border-b-0",
                          selectedUserId === user.id
                            ? "bg-[#EAF2FE]"
                            : "hover:bg-[#FAFBFC]",
                        )}
                      >
                        <span className="text-[13px] leading-5 text-black">
                          {user.name}
                        </span>
                        <span className="text-[11px] leading-4 text-[#6B7280]">
                          {user.email ?? "-"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-[12px] text-[#6B7280]">
                      No {ROLE_LABELS[role] ?? role} accounts match that search.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] leading-4 text-[#9CA3AF]">
                  Type at least 2 characters to search.
                </p>
              )}
            </div>

            {error ? (
              <p className="flex items-start gap-1.5 rounded-[6px] bg-[#FFFBFA] p-2 text-[12px] leading-4 text-[#B42318]">
                <AlertCircle size={13} className="mt-px shrink-0" />
                {error}
              </p>
            ) : null}

            <Button
              onClick={() => void handleGrant()}
              disabled={!selectedTier || !selectedUser || approve.isPending}
              className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#0669D9] text-[14px] text-white disabled:opacity-60"
            >
              {approve.isPending ? <Spinner /> : null}
              {selectedTier && selectedUser
                ? `Grant ${selectedTier.tierLabel}`
                : "Grant tier"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
