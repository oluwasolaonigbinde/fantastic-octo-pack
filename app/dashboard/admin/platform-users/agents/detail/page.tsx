"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  KeyRound,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";
import { useAdminPlatformUsersQuery } from "@/hooks/queries/admin";
import { type AdminPlatformUserRow } from "@/services/adminService";
import { UserRole } from "@/types/user";

const NOT_AVAILABLE = "Not available";

const actionCards = [
  {
    title: "Operations",
    description: "View full profile, managed businesses and activity",
    icon: BriefcaseBusiness,
  },
  {
    title: "Relationships",
    description: "Buyer, distributor, OEM and engineer coverage",
    icon: Users,
  },
  {
    title: "Compliance",
    description: "KYC, verification and oversight status",
    icon: ShieldCheck,
  },
  {
    title: "Commission",
    description: "Commission history and payout summary",
    icon: CircleDollarSign,
  },
  {
    title: "Disputes",
    description: "Disputes raised across managed businesses",
    icon: TriangleAlert,
  },
  {
    title: "System Control",
    description: "Permissions, activity log and analytics",
    icon: KeyRound,
  },
] as const;

function formatDateTime(value?: string | null) {
  if (!value) return NOT_AVAILABLE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;

  return `${date.toLocaleDateString("en-GB")} - ${date
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()}`;
}

function formatStatus(value?: string | null) {
  if (!value) return NOT_AVAILABLE;

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string) {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("") || "AG"
  );
}

export default function AdminAgentDetailPage() {
  const searchParams = useSearchParams();

  const requestedId = searchParams.get("id");

  const agentsQuery = useAdminPlatformUsersQuery({
    role: UserRole.AGENT,
    page: 1,
    limit: 20,
  });

  const loading = agentsQuery.isPending;
  const error = agentsQuery.isError
    ? agentsQuery.error instanceof Error
      ? agentsQuery.error.message
      : "Unable to load agent details."
    : "";

  const agent: AdminPlatformUserRow | null = useMemo(() => {
    const docs = agentsQuery.data?.docs ?? [];
    return docs.find((row) => row.id === requestedId) ?? docs[0] ?? null;
  }, [agentsQuery.data, requestedId]);

  const agentName = useMemo(() => agent?.name || "Agent detail", [agent]);
  const statusLabel = useMemo(() => formatStatus(agent?.status), [agent?.status]);
  const statusClassName = statusLabel.toLowerCase().includes("pending")
    ? "text-warning"
    : "text-success";

  const detailRows = useMemo(
    () => [
      ["User ID", agent?.id || NOT_AVAILABLE],
      ["Phone Number", agent?.phoneNumber || NOT_AVAILABLE],
      ["Email", agent?.email || NOT_AVAILABLE],
      ["Date Joined", formatDateTime(agent?.dateRegistered)],
      ["Country", agent?.country || NOT_AVAILABLE],
    ],
    [agent],
  );

  return (
    <div className="min-h-screen bg-gray7">
      <Header
        title="Platform Users"
        description="View all users and process onboarding request from users"
      />

      <main className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/admin/platform-users"
            className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-primary"
          >
            <ArrowLeft size={24} strokeWidth={1.75} />
            Go Back
          </Link>

          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-danger"
          >
            <Ban size={18} strokeWidth={1.8} />
            Suspend Account
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <section className="mt-5 w-full rounded-2xl border border-gray5 bg-white px-10 py-10">
          <div className="grid gap-10 xl:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-8 py-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex size-[120px] items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-semibold text-white">
                  {agent?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agent.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <>
                      <span className="absolute inset-y-0 right-0 w-1/2 bg-[#FE6E00]" />
                      <span className="relative z-10">{getInitials(agentName)}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <h1 className="text-center text-[32px] font-medium leading-[48px] text-gray1">
                    {loading ? "Loading agent..." : agentName}
                  </h1>
                  <div className="flex flex-col items-center gap-3">
                    <span className="rounded-lg bg-[#EAF9FF] px-2 py-1 text-base font-normal leading-6 text-primary">
                      Agent
                    </span>
                    <span
                      className={`inline-flex items-center gap-3 rounded-lg bg-[rgba(107,114,128,0.06)] p-2 text-lg font-medium leading-6 ${statusClassName}`}
                    >
                      <UserCheck size={24} className={statusClassName} />
                      {loading ? "Loading status" : statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray5" />

              <div className="flex flex-col gap-5">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="border-b border-gray5 pb-5">
                    <div className="space-y-1">
                      <p className="text-sm font-normal leading-5 text-gray2">{label}</p>
                      <p className="text-xl font-semibold leading-8 text-gray1">{value}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-[#EAF1F6] bg-[#F8FBFD] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-normal leading-5 text-gray2">Managed businesses</p>
                      <p className="text-xl font-semibold leading-8 text-gray1">Not available</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-[#EAF9FF] px-3 py-2 text-sm font-medium text-primary">
                      <Workflow size={18} />
                      Cross-role oversight
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-2 self-start text-lg font-normal leading-8 text-danger"
                >
                  <Ban size={18} strokeWidth={1.8} />
                  Suspend Account
                </button>
              </div>
            </div>

            <aside className="border-l border-gray5 pl-6 pt-6">
              <div className="mb-5 space-y-1">
                <h2 className="text-xl font-semibold leading-8 text-gray1">Actions</h2>
                <p className="text-sm font-normal leading-5 text-gray2">
                  Manage platform actions for this agent.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {actionCards.map(({ title, description, icon: Icon }) => (
                  <button
                    key={title}
                    type="button"
                    className="flex h-[78px] w-full items-center justify-between rounded-[20px] border border-gray6 bg-white px-2 py-3 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex size-[62px] items-center justify-center rounded-[20px] bg-[#EAF9FF] text-primary">
                        <Icon size={36} strokeWidth={1.8} />
                      </span>
                      <span className="flex min-w-0 flex-col justify-center">
                        <span className="text-xl font-semibold leading-8 text-gray1">
                          {title}
                        </span>
                        <span className="text-base font-normal leading-6 text-gray2">
                          {description}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={22} strokeWidth={1.8} className="shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
