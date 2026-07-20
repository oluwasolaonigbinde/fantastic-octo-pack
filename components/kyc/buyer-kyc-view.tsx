"use client";

/**
 * Buyer KYC / Account Tiers.
 *
 * Buyer has two tiers (see `docs/kyc/README.md`):
 *   1. `basic_buyer`              — auto-granted at signup, nothing to submit.
 *   2. `verified_business_buyer`  — review_required, needs CAC certificate
 *                                   + CAC status report. No prerequisite.
 *
 * Everything renders off `useMyKycQuery()`; the static catalogue in
 * `constants/kycTiers.ts` is only used for slug resolution.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  RotateCcw,
  Upload,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  useCreateKycSubmissionMutation,
  useMyKycQuery,
} from "@/hooks/queries/kyc";
import { cn } from "@/lib/utils";
import authService from "@/services/authService";
import { setUser } from "@/store/slices/auth-slice";
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_UPLOAD_MAX_FILE_SIZE_BYTES,
  type KycSubmission,
  type KycTierDefinition,
} from "@/types/kyc";
import { UserRole } from "@/types/user";
import { getKycFileTypeLabel } from "@/utils/kycFileTypeLabel";

import {
  KYC_ROLE_DESCRIPTIONS,
  KYC_ROLE_INTRO_COPY,
  KYC_ROLE_PATHS,
  KYC_UPLOAD_ACCEPT,
  KYC_UPLOAD_FORMAT_LABEL,
} from "./config";

const BASE_PATH = KYC_ROLE_PATHS[UserRole.BUYER];

/**
 * Presentation-only copy overrides, keyed by `tierKey`. The server's
 * `tierLabel` / `processingTime` stay authoritative everywhere else (admin
 * queue, badges, API payloads) — this only shortens what the buyer sees, per
 * the approved designs. Drop an entry to fall back to the server value.
 */
const BUYER_TIER_COPY: Record<
  string,
  { label?: string; processingTime?: string }
> = {
  verified_business_buyer: {
    label: "Business Buyer",
    processingTime: "Processing time 24-48 hours",
  },
};

const tierLabelOf = (tier: KycTierDefinition) =>
  BUYER_TIER_COPY[tier.tierKey]?.label ?? tier.tierLabel;

const tierProcessingTimeOf = (tier: KycTierDefinition) =>
  BUYER_TIER_COPY[tier.tierKey]?.processingTime ?? tier.processingTime;

/* ------------------------------------------------------------------ */
/* Tier state                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every state a buyer tier can be in. `pending` covers `submitted`,
 * `under_review` and `draft_submission` — all three block resubmission
 * server-side, so they behave identically here and differ only in label.
 */
type TierState =
  | "held" // auto-granted (Basic Buyer)
  | "approved" // review passed
  | "pending" // awaiting an admin
  | "rejected" // admin rejected — the only state that allows a retry
  | "available"; // nothing submitted yet

interface TierView {
  tier: KycTierDefinition;
  state: TierState;
  /** Latest submission for this tier, if any. */
  submission: KycSubmission | null;
  /** Precise label for pending sub-states. */
  statusLabel: string;
  canSubmit: boolean;
}

const STATUS_STYLES: Record<TierState, string> = {
  held: "bg-[#F3F4F6] text-[#4B5563]",
  approved: "bg-[#E7F7EC] text-[#13A83B]",
  pending: "bg-[#FFF4E5] text-[#E26B0A]",
  rejected: "bg-[#FDECEC] text-[#D92D20]",
  available: "bg-[#EAF2FE] text-[#0669D9]",
};

const ICON_COLORS: Record<TierState, string> = {
  held: "#6B7280",
  approved: "#13A83B",
  pending: "#FFC000",
  rejected: "#D92D20",
  available: "#6B7280",
};

function StatusPill({ state, label }: { state: TierState; label: string }) {
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium leading-4",
        STATUS_STYLES[state],
      )}
    >
      {state === "approved" ? <CheckCircle2 size={13} /> : null}
      {state === "pending" ? <Clock3 size={13} /> : null}
      {state === "rejected" ? <AlertCircle size={13} /> : null}
      {label}
    </span>
  );
}

/** Newest-first, so a retry after rejection wins over the old rejected row. */
const latestSubmissionFor = (
  submissions: KycSubmission[],
  tierKey: string,
): KycSubmission | null => {
  const matches = submissions
    .filter((submission) => submission.tierKey === tierKey)
    .toSorted(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );

  return matches[0] ?? null;
};

const buildTierView = (
  tier: KycTierDefinition,
  submissions: KycSubmission[],
): TierView => {
  // Auto-granted tiers are held by definition — they have no submission.
  if (tier.submissionBehavior === "none") {
    return {
      tier,
      state: "held",
      submission: null,
      statusLabel: "",
      canSubmit: false,
    };
  }

  const submission = latestSubmissionFor(submissions, tier.tierKey);

  if (!submission) {
    return {
      tier,
      state: "available",
      submission: null,
      statusLabel: "Not submitted",
      canSubmit: tier.submissionBehavior === "review_required",
    };
  }

  switch (submission.status) {
    case "approved":
      return {
        tier,
        state: "approved",
        submission,
        statusLabel: "Approved",
        canSubmit: false,
      };
    case "rejected":
      return {
        tier,
        state: "rejected",
        submission,
        statusLabel: "Rejected",
        canSubmit: true,
      };
    case "under_review":
      return {
        tier,
        state: "pending",
        submission,
        statusLabel: "Under review",
        canSubmit: false,
      };
    case "draft_submission":
      return {
        tier,
        state: "pending",
        submission,
        statusLabel: "Awaiting submission",
        canSubmit: false,
      };
    default:
      return {
        tier,
        state: "pending",
        submission,
        statusLabel: "Pending approval",
        canSubmit: false,
      };
  }
};

const formatUploadedAt = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("en-GB", { month: "short" });
  const time = date
    .toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(" ", "");

  return `${day}${suffix} ${month} ${date.getFullYear()} - ${time}`;
};

/** Client-side mirror of the server's upload rules, for a faster error. */
const validateFile = (file: File): string | null => {
  if (file.size > KYC_UPLOAD_MAX_FILE_SIZE_BYTES) {
    return `${file.name} is larger than 5MB`;
  }

  if (
    file.type &&
    !KYC_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof KYC_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return `${file.name} is not an allowed format (${KYC_UPLOAD_FORMAT_LABEL})`;
  }

  return null;
};

/* ------------------------------------------------------------------ */

export default function BuyerKycView({
  selectedTierSlug,
}: {
  selectedTierSlug?: string;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: authUser } = useAppSelector((state) => state.auth);
  const token = authUser?.tokens?.accessToken ?? "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTierLabel, setSubmittedTierLabel] = useState<string | null>(null);

  const kycQuery = useMyKycQuery();
  const createSubmission = useCreateKycSubmissionMutation();

  const tiers = useMemo(() => kycQuery.data?.tiers ?? [], [kycQuery.data?.tiers]);
  const submissions = useMemo(
    () => kycQuery.data?.submissions ?? [],
    [kycQuery.data?.submissions],
  );

  const tierViews = useMemo(
    () => tiers.map((tier) => buildTierView(tier, submissions)),
    [submissions, tiers],
  );

  const selectedView = useMemo(
    () =>
      selectedTierSlug
        ? (tierViews.find((view) => view.tier.routeSlug === selectedTierSlug) ?? null)
        : null,
    [selectedTierSlug, tierViews],
  );

  /** Highest approved/held tier — what the header badge shows. */
  const currentTierLabel = useMemo(() => {
    const held = tierViews
      .filter((view) => view.state === "approved" || view.state === "held")
      .toSorted((a, b) => b.tier.tierOrdinal - a.tier.tierOrdinal)[0];

    return held ? tierLabelOf(held.tier) : (authUser?.kycBadgeLabel ?? "Basic Buyer");
  }, [authUser?.kycBadgeLabel, tierViews]);

  /** The tier the "Upgrade" CTA should take the buyer to. */
  const upgradeTarget = useMemo(
    () =>
      tierViews.find((view) => view.state === "rejected") ??
      tierViews.find((view) => view.state === "available") ??
      tierViews.find((view) => view.state === "pending") ??
      null,
    [tierViews],
  );

  const hasApproved = submissions.some(
    (submission) => submission.status === "approved",
  );

  // An approval changes the buyer's badge globally — resync the auth profile.
  const refreshAuthProfile = useCallback(async () => {
    if (!token) return;

    try {
      const currentUser = await authService.getCurrentUser(token);
      if (currentUser.kycBadgeLabel === authUser?.kycBadgeLabel) return;

      dispatch(
        setUser({
          ...currentUser,
          tokens: authUser?.tokens ?? currentUser.tokens,
        }),
      );
    } catch {
      // KYC stays usable even if the profile refresh fails.
    }
  }, [authUser, dispatch, token]);

  useEffect(() => {
    if (hasApproved) void refreshAuthProfile();
  }, [hasApproved, refreshAuthProfile]);

  const openDialog = (view: TierView) => {
    setFiles(
      Object.fromEntries(
        view.tier.requiredDocuments.map((document) => [document.fieldName, null]),
      ),
    );
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (view: TierView) => {
    if (createSubmission.isPending) return;

    setSubmitError(null);

    try {
      const documents = [];

      for (const definition of view.tier.requiredDocuments) {
        const file = files[definition.fieldName];
        if (!file) {
          throw new Error(`${definition.label} is required`);
        }

        const invalid = validateFile(file);
        if (invalid) throw new Error(invalid);

        documents.push({ fieldName: definition.fieldName, file });
      }

      // Text fields and files go up together as one multipart request.
      await createSubmission.mutateAsync({
        tierKey: view.tier.tierKey,
        documents,
      });

      setDialogOpen(false);
      setFiles({});
      setSubmittedTierLabel(tierLabelOf(view.tier));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit your documents",
      );
    }
  };

  /* ---------------------------------------------------------------- */
  /* Loading / error                                                   */
  /* ---------------------------------------------------------------- */

  if (kycQuery.isLoading) {
    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[UserRole.BUYER]} />
        <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
          <div className="h-[92px] animate-pulse rounded-2xl border border-[#DDE0E5] bg-white" />
          <div className="h-[69px] animate-pulse rounded-[10px] bg-white" />
          <div className="h-[69px] animate-pulse rounded-[10px] bg-white" />
        </div>
      </>
    );
  }

  if (kycQuery.isError) {
    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[UserRole.BUYER]} />
        <div className="bg-[#F9FAFB] p-4 md:p-6">
          <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#FDA29B] bg-[#FFFBFA] p-6">
            <div className="flex items-center gap-2 text-[#D92D20]">
              <AlertCircle size={18} />
              <p className="text-[14px] font-medium">Unable to load your account tiers</p>
            </div>
            <p className="text-[13px] leading-5 text-[#4B5563]">
              {kycQuery.error instanceof Error
                ? kycQuery.error.message
                : "Something went wrong."}
            </p>
            <Button
              onClick={() => void kycQuery.refetch()}
              className="mt-1 inline-flex h-[38px] items-center gap-2 rounded-xl bg-[#0669D9] px-4 text-[13px] text-white"
            >
              <RotateCcw size={14} />
              Try again
            </Button>
          </div>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Detail                                                            */
  /* ---------------------------------------------------------------- */

  if (selectedTierSlug) {
    // Slug that matches no tier for this role.
    if (!selectedView) {
      return (
        <>
          <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[UserRole.BUYER]} />
          <div className="bg-[#F9FAFB] p-4 md:p-6">
            <div className="rounded-[10px] bg-white p-6">
              <p className="text-[15px] font-medium text-black">Tier not found</p>
              <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
                That verification tier doesn&apos;t exist for a buyer account.
              </p>
              <Link
                href={BASE_PATH}
                className="mt-4 inline-flex items-center gap-2 text-[14px] text-[#0669D9]"
              >
                <ArrowLeft size={16} />
                Back to account tiers
              </Link>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[UserRole.BUYER]} />
        <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
          <button
            type="button"
            onClick={() => router.push(BASE_PATH)}
            className="inline-flex items-center gap-2 text-[15px] leading-6 text-black"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          {renderDetailCard(selectedView)}
        </div>

        {renderUploadDialog(selectedView)}
        {renderSuccessDialog()}
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /* List                                                              */
  /* ---------------------------------------------------------------- */

  return (
    <>
      <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[UserRole.BUYER]} />
      <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
        <section className="flex min-h-[92px] items-center justify-between gap-6 rounded-2xl border border-[#DDE0E5] bg-white px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-medium leading-8 text-[#111827]">
              Account Tiers
            </h2>
            <p className="text-[14px] leading-5 text-[#4B5563]">
              {KYC_ROLE_INTRO_COPY[UserRole.BUYER]}
            </p>
          </div>

          <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium leading-6 text-[#4B5563]">
                {currentTierLabel}
              </span>
              <BadgeCheck size={20} className="shrink-0 text-[#6B7280]" />
            </div>
            {/* Nothing left to upgrade to once every tier is approved. */}
            {upgradeTarget ? (
              <Link
                href={`${BASE_PATH}/${upgradeTarget.tier.routeSlug}`}
                className="inline-flex h-[34px] w-[107px] items-center justify-center rounded-xl bg-[#0669D9] text-[12px] leading-[14px] text-white"
              >
                Upgrade
              </Link>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          {tierViews.map((view) => {
            const detailHref = `${BASE_PATH}/${view.tier.routeSlug}`;
            const processingTime = tierProcessingTimeOf(view.tier);

            return (
              <article
                key={view.tier.tierKey}
                onClick={() => router.push(detailHref)}
                className="flex min-h-[69px] cursor-pointer flex-col items-start justify-between gap-3 overflow-hidden rounded-[10px] bg-white px-[10px] py-4 sm:flex-row sm:items-center sm:gap-4 sm:py-0"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="flex shrink-0 items-center gap-[9px]">
                    <span className="text-[16px] font-normal leading-6 text-black">
                      {tierLabelOf(view.tier)}
                    </span>
                    <BadgeCheck
                      size={20}
                      className="shrink-0"
                      style={{ color: ICON_COLORS[view.state] }}
                    />
                  </div>
                  {processingTime ? (
                    <span className="w-full text-[13px] font-normal leading-5 text-black sm:w-auto sm:truncate sm:text-[14px]">
                      ({processingTime})
                    </span>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
                  <StatusPill state={view.state} label={view.statusLabel} />
                  <Link
                    href={detailHref}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-2 text-[15px] font-normal leading-6 text-black sm:text-[16px]"
                  >
                    See details
                    <ChevronRight size={24} strokeWidth={2} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {renderSuccessDialog()}
    </>
  );

  /* ---------------------------------------------------------------- */
  /* Renderers                                                         */
  /* ---------------------------------------------------------------- */

  function renderDetailCard(view: TierView) {
    const { tier, state, submission } = view;

    // Auto-granted tier: no documents exist, so show the account details that
    // earned it instead of an empty table.
    if (tier.submissionBehavior === "none") {
      const fields = [
        { label: "First name", value: authUser?.firstName || "-" },
        { label: "Last name", value: authUser?.lastName || "-" },
        { label: "First Email address", value: authUser?.email || "-" },
        { label: "Phone number", value: authUser?.phoneNumber || "-" },
      ];

      return (
        <section className="rounded-[10px] bg-white p-4 md:p-5">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-medium leading-6 text-black">
              {tierLabelOf(tier)}
            </h3>
            <BadgeCheck size={18} style={{ color: ICON_COLORS.held }} />
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
            View all uploaded requirement
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 border-t border-[#EEF0F3] pt-5 sm:grid-cols-2 lg:max-w-[520px]">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-[12px] leading-4 text-[#9CA3AF]">{field.label}</dt>
                <dd className="mt-1 text-[14px] leading-5 text-black">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }

    const documents = submission?.documents ?? [];

    return (
      <section className="rounded-[10px] bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-medium leading-6 text-black">
                {tierLabelOf(tier)}
              </h3>
              <BadgeCheck size={18} style={{ color: ICON_COLORS[state] }} />
            </div>
            <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
              View all uploaded requirement
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <StatusPill state={state} label={view.statusLabel} />
            {view.canSubmit ? (
              <Button
                onClick={() => openDialog(view)}
                className="inline-flex h-[38px] items-center justify-center rounded-xl bg-[#0669D9] px-4 text-[13px] text-white"
              >
                {state === "rejected" ? "Resubmit" : "Upgrade"}
              </Button>
            ) : null}
          </div>
        </div>

        {/* A rejection is the only state the buyer can act on — lead with why. */}
        {state === "rejected" && submission?.rejectionReason ? (
          <div className="mt-4 flex items-start gap-2 rounded-[8px] border border-[#FDA29B] bg-[#FFFBFA] p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#D92D20]" />
            <div>
              <p className="text-[13px] font-medium leading-5 text-[#B42318]">
                Your submission was rejected
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-[#4B5563]">
                {submission.rejectionReason}
              </p>
            </div>
          </div>
        ) : null}

        {state === "pending" ? (
          <p className="mt-4 rounded-[8px] bg-[#FFF9F0] p-3 text-[13px] leading-5 text-[#8A5A00]">
            Your documents are with our review team. You&apos;ll be notified once a
            decision is made — no action is needed from you right now.
          </p>
        ) : null}

        {documents.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[16%]" />
                <col className="w-[32%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="h-[34px] bg-[#FAFBFC] text-[12px] font-normal leading-4 text-[#4B5563]">
                  <th className="px-3 font-normal">Document name</th>
                  <th className="px-3 font-normal">Type</th>
                  <th className="px-3 font-normal">Date uploaded</th>
                  <th className="px-3 text-center font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr
                    key={`${document.fieldName}-${document.fileUrl}`}
                    className="h-[46px] border-b border-[#F1F3F5] text-[13px] leading-5 text-black"
                  >
                    <td className="truncate px-3">
                      {tier.requiredDocuments.find(
                        (definition) => definition.fieldName === document.fieldName,
                      )?.label ?? document.fileName}
                    </td>
                    <td className="px-3">
                      {getKycFileTypeLabel(document.fileType, document.fileName)}
                    </td>
                    <td className="px-3">{formatUploadedAt(document.uploadedAt)}</td>
                    <td className="px-3 text-center">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${document.fileName}`}
                        className="inline-flex items-center justify-center text-[#6B7280] hover:text-[#0669D9]"
                      >
                        <Eye size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-[8px] border border-dashed border-[#DDE0E5] p-6 text-center">
            <p className="text-[14px] leading-5 text-black">
              You haven&apos;t uploaded any documents for this tier yet.
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
              Required: {tier.requiredDocuments.map((d) => d.label).join(", ")}.
            </p>
          </div>
        )}
      </section>
    );
  }

  function renderUploadDialog(view: TierView) {
    const busy = createSubmission.isPending;

    return (
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (busy) return; // don't drop an in-flight upload
          setDialogOpen(open);
          if (!open) setSubmitError(null);
        }}
      >
        <DialogContent className="w-[92vw] max-w-[420px] rounded-[12px] bg-white p-5">
          <DialogHeader>
            <DialogTitle className="pr-6 text-left text-[15px] font-medium leading-6 text-black">
              Enter information below to upgrade verification status.
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {view.tier.requiredDocuments.map((definition) => {
              const file = files[definition.fieldName] ?? null;

              return (
                <div key={definition.fieldName}>
                  <p className="mb-1.5 text-[13px] leading-5 text-[#4B5563]">
                    {definition.label}
                  </p>

                  <label
                    className={cn(
                      "flex h-[86px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed px-3 text-center",
                      file
                        ? "border-[#0669D9] bg-[#F5F9FF]"
                        : "border-[#DDE0E5] bg-white",
                    )}
                  >
                    <input
                      type="file"
                      className="sr-only"
                      accept={KYC_UPLOAD_ACCEPT}
                      disabled={busy}
                      onChange={(event) => {
                        const selected = event.target.files?.[0] ?? null;
                        if (!selected) return;

                        const invalid = validateFile(selected);
                        if (invalid) {
                          setSubmitError(invalid);
                          event.target.value = "";
                          return;
                        }

                        setSubmitError(null);
                        setFiles((previous) => ({
                          ...previous,
                          [definition.fieldName]: selected,
                        }));
                      }}
                    />

                    {file ? (
                      <>
                        <span className="max-w-full truncate px-2 text-[12px] leading-4 text-black">
                          {file.name}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] leading-4 text-[#0669D9]">
                          <Upload size={11} />
                          Click to replace
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] leading-4 text-[#0669D9]">
                          Click here{" "}
                          <span className="text-[#6B7280]">to upload file</span>
                        </span>
                        <span className="mt-1 text-[10px] leading-4 text-[#9CA3AF]">
                          Allowed format – {KYC_UPLOAD_FORMAT_LABEL}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              );
            })}

            <p className="text-[11px] leading-4 text-[#D92D20]">
              Note: Each document must be 5MB or smaller.
            </p>

            {submitError ? (
              <p className="flex items-start gap-1.5 rounded-[6px] bg-[#FFFBFA] p-2 text-[12px] leading-4 text-[#B42318]">
                <AlertCircle size={13} className="mt-px shrink-0" />
                {submitError}
              </p>
            ) : null}

            <Button
              onClick={() => void handleSubmit(view)}
              disabled={busy}
              className="inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#0669D9] text-[14px] text-white disabled:opacity-60"
            >
              {busy ? <Spinner /> : null}
              {busy ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function renderSuccessDialog() {
    return (
      <Dialog
        open={Boolean(submittedTierLabel)}
        onOpenChange={(open) => {
          if (!open) setSubmittedTierLabel(null);
        }}
      >
        <DialogContent className="w-[92vw] max-w-[380px] rounded-[12px] bg-white p-6 text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Submission received</DialogTitle>
          </DialogHeader>

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F7EC]">
            <CheckCircle2 size={24} className="text-[#13A83B]" />
          </div>
          <p className="text-[15px] font-medium leading-6 text-black">
            Documents submitted
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
            Your {submittedTierLabel} upgrade is pending approval. We&apos;ll let you
            know once the review is complete.
          </p>
          <Button
            onClick={() => setSubmittedTierLabel(null)}
            className="mt-5 inline-flex h-[42px] w-full items-center justify-center rounded-[8px] bg-[#0669D9] text-[14px] text-white"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }
}
