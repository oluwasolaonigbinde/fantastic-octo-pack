"use client";

/**
 * Admin KYC review queue.
 *
 * Rows come from `GET /kyc/admin/submissions`, which is **submission-scoped**:
 * a user who has never submitted has no row here. This queue is therefore a
 * list of things to review, not a roster of users — by design. Don't add a
 * "Not started" row; it would require listing users instead of submissions.
 *
 * Server-supported filters: `status`, `kycLevel`, `userCategory`, `date`.
 * Name search is *not* server-supported and is applied client-side — see
 * `nameQuery` below.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Filter,
  RotateCcw,
  ShieldCheck,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";
import {
  Button,
  Input,
  SingleSelect,
  SummaryCard,
} from "@/components/base";
import { ALL_KYC_TIERS } from "@/constants/kycTiers";
import { useAdminPlatformUsersSummaryQuery } from "@/hooks/queries/admin";
import {
  useAdminKycListQuery,
  useAdminKycStatsQuery,
} from "@/hooks/queries/kyc";
import { cn } from "@/lib/utils";
import { type AdminKycFilters } from "@/services/kycService";

import AdminKycPremiumGrant from "./admin-kyc-premium-grant";
import AdminKycReviewDrawer from "./admin-kyc-review-drawer";

/** Server `formatStatusLabel` output → row colour. */
const STATUS_COLORS: Record<string, string> = {
  Pending: "text-[#E26B0A]",
  "Under review": "text-[#0669D9]",
  Approved: "text-[#13A83B]",
  Rejected: "text-[#D92D20]",
  Draft: "text-[#6B7280]",
};

const CATEGORY_OPTIONS = [
  { label: "All Category", value: "all" },
  { label: "Buyer", value: "buyer" },
  { label: "Distributor", value: "distributor" },
  { label: "OEM", value: "oem" },
  { label: "Service Engineer", value: "engineer" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

/** Every distinct tier label, for the `kycLevel` filter. */
const TIER_OPTIONS = [
  { label: "All Tiers", value: "all" },
  ...Array.from(new Set(ALL_KYC_TIERS.map((tier) => tier.tierLabel))).map(
    (label) => ({ label, value: label }),
  ),
];

/**
 * The list returns `kycLevel` as a tier *label*; the design shows a tier
 * *number*. Resolve via the catalogue rather than parsing the string.
 */
const tierOrdinalOf = (kycLevel: string): string =>
  ALL_KYC_TIERS.find((tier) => tier.tierLabel === kycLevel)?.tierOrdinal
    ?.toString() ?? "-";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

export default function AdminKycManagement() {
  const router = useRouter();

  /** Applied filters — only updated when "Filter" is pressed. */
  const [filters, setFilters] = useState<AdminKycFilters>({
    status: "all",
    userCategory: "all",
    kycLevel: "",
    date: "",
  });
  /** Pending form state, so typing doesn't refetch on every keystroke. */
  const [draft, setDraft] = useState<AdminKycFilters & { name: string }>({
    status: "all",
    userCategory: "all",
    kycLevel: "",
    date: "",
    name: "",
  });
  const [nameQuery, setNameQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);

  const statsQuery = useAdminKycStatsQuery();
  const usersSummaryQuery = useAdminPlatformUsersSummaryQuery();
  const listQuery = useAdminKycListQuery(filters);

  const stats = statsQuery.data ?? null;
  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  /**
   * Name search is client-side because the server exposes no name/email
   * filter — so it only narrows rows already fetched. If the list ever gets
   * server pagination this becomes misleading and needs a backend `search`.
   */
  const visibleRows = useMemo(() => {
    const needle = nameQuery.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter(
      (row) =>
        row.fullName.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle),
    );
  }, [nameQuery, rows]);

  const applyFilters = () => {
    const { name, ...rest } = draft;
    setFilters(rest);
    setNameQuery(name);
  };

  const listError = listQuery.isError
    ? listQuery.error instanceof Error
      ? listQuery.error.message
      : "Unable to load the KYC queue"
    : null;

  const summary = [
    {
      title: "Total Users",
      // Not a KYC stat — /kyc/admin/stats has no total-users figure.
      value: usersSummaryQuery.data?.approvedUsers.total,
      icon: <Users size={18} className="text-[#0669D9]" />,
      iconBg: "#EAF2FE",
    },
    {
      title: "Under Review",
      // Server counts `submitted` + `under_review` together.
      value: stats?.pendingKycReviews,
      icon: <Filter size={18} className="text-[#7C3AED]" />,
      iconBg: "#F3EEFF",
    },
    {
      title: "Verified",
      value: stats?.totalVerifiedUsers,
      icon: <ShieldCheck size={18} className="text-[#E29A0A]" />,
      iconBg: "#FFF6E5",
    },
    {
      title: "Rejected",
      value: stats?.rejectedSubmissions,
      icon: <XCircle size={18} className="text-[#D92D20]" />,
      iconBg: "#FDECEC",
    },
  ];

  return (
    <>
      <Header
        title="User Management"
        description="View and create users, roles, and privileges."
      />

      <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[15px] leading-6 text-black"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={
                card.value === undefined ? "—" : card.value.toLocaleString("en-GB")
              }
              icon={card.icon}
              iconBg={card.iconBg}
            />
          ))}
        </section>

        <section className="rounded-[10px] bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[18px] font-medium leading-7 text-black">KYC</h2>
            {/* Premium tiers have no application flow — granting is admin-only. */}
            <Button
              onClick={() => setGrantOpen(true)}
              className="inline-flex h-[38px] items-center gap-2 rounded-xl border border-[#DDE0E5] bg-white px-4 text-[13px] text-[#4B5563]"
            >
              <Star size={14} className="text-[#F59E0B]" />
              Grant premium
            </Button>
          </div>

          <p className="mt-4 text-[13px] leading-5 text-[#6B7280]">
            Filter table list by:
          </p>

          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="w-full lg:w-[200px]">
              <Input
                id="kyc-name-filter"
                label="User name"
                value={draft.name}
                placeholder="Enter user name"
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
              />
            </div>

            <div className="w-full lg:w-[180px]">
              <SingleSelect
                label="Category"
                value={draft.userCategory ?? "all"}
                options={CATEGORY_OPTIONS}
                onValueChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    userCategory: value as AdminKycFilters["userCategory"],
                  }))
                }
              />
            </div>

            <div className="w-full lg:w-[180px]">
              <SingleSelect
                label="Status"
                value={draft.status ?? "all"}
                options={STATUS_OPTIONS}
                onValueChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    status: value as AdminKycFilters["status"],
                  }))
                }
              />
            </div>

            <div className="w-full lg:w-[200px]">
              <SingleSelect
                label="Tier"
                value={draft.kycLevel || "all"}
                options={TIER_OPTIONS}
                onValueChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    kycLevel: value === "all" ? "" : value,
                  }))
                }
              />
            </div>

            <div className="w-full lg:w-[160px]">
              <Input
                id="kyc-date-filter"
                label="Submitted on"
                type="date"
                value={draft.date ?? ""}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, date: event.target.value }))
                }
              />
            </div>

            <Button
              onClick={applyFilters}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-[#0669D9] px-6 text-[14px] text-white lg:w-[140px]"
            >
              <Filter size={15} />
              Filter
            </Button>
          </div>

          {/* Results */}
          <div className="mt-5">
            {listQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-[46px] animate-pulse rounded-[6px] bg-[#F3F4F6]"
                  />
                ))}
              </div>
            ) : listError ? (
              <div className="flex flex-col items-start gap-3 rounded-[8px] border border-[#FDA29B] bg-[#FFFBFA] p-5">
                <div className="flex items-center gap-2 text-[#D92D20]">
                  <AlertCircle size={17} />
                  <p className="text-[14px] font-medium">Unable to load the queue</p>
                </div>
                <p className="text-[13px] leading-5 text-[#4B5563]">{listError}</p>
                <Button
                  onClick={() => void listQuery.refetch()}
                  className="inline-flex h-[36px] items-center gap-2 rounded-xl bg-[#0669D9] px-4 text-[13px] text-white"
                >
                  <RotateCcw size={14} />
                  Try again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="h-[38px] text-[12px] font-normal leading-4 text-[#4B5563]">
                      <th className="px-3 font-normal">User&apos;s name</th>
                      <th className="px-3 font-normal">Category</th>
                      <th className="px-3 font-normal">Tier</th>
                      <th className="px-3 font-normal">Submitted on</th>
                      <th className="px-3 font-normal">Documents</th>
                      <th className="px-3 font-normal">Status</th>
                      <th className="px-3 text-center font-normal">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length ? (
                      visibleRows.map((row) => (
                        <tr
                          key={row._id}
                          className="h-[52px] border-t border-[#F1F3F5] text-[13px] leading-5 text-black"
                        >
                          <td className="px-3">
                            <p className="truncate font-normal">
                              {row.fullName || "Unnamed user"}
                            </p>
                            <p className="truncate text-[11px] leading-4 text-[#6B7280]">
                              {row.email}
                            </p>
                          </td>
                          <td className="px-3">{row.role}</td>
                          <td className="px-3">{tierOrdinalOf(row.kycLevel)}</td>
                          <td className="px-3">{formatDate(row.registrationDate)}</td>
                          <td className="px-3">{row.documentSubmitted}</td>
                          <td
                            className={cn(
                              "px-3 font-medium",
                              STATUS_COLORS[row.status] ?? "text-[#6B7280]",
                            )}
                          >
                            {row.status}
                          </td>
                          <td className="px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(row._id);
                                setDrawerOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 text-[13px] text-[#13A83B]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <p className="text-[14px] leading-5 text-black">
                            No submissions match these filters.
                          </p>
                          {nameQuery ? (
                            <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
                              Name search only narrows the rows already loaded.
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Remount per record so draft rejection text never leaks between rows. */}
      <AdminKycReviewDrawer
        key={selectedId ?? "none"}
        submissionId={selectedId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedId(null);
        }}
      />

      <AdminKycPremiumGrant open={grantOpen} onClose={() => setGrantOpen(false)} />
    </>
  );
}
