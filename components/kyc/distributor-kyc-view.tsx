"use client";

/**
 * Distributor KYC / Account Tiers.
 *
 * Four tiers (see `docs/kyc/README.md` §4):
 *   1. `basic_distributor`      — auto-granted at signup, nothing to submit.
 *   2. `registered_distributor` — review_required, text only. Approval
 *                                 activates the marketplace account.
 *   3. `verified_distributor`   — review_required, needs tier 2 approved.
 *   4. `premium_distributor`    — admin_only. Never gets a submit CTA.
 *
 * Everything renders off `useMyKycQuery()`; `constants/kycTiers.ts` is only
 * used for slug resolution. Built to the state model in §6 — the CTA appears
 * in exactly two states (`available`, `rejected`) and only once the tier's
 * prerequisite is approved.
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
  FileText,
  Lock,
  RotateCcw,
  Star,
  Upload,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  SingleSelect,
  Spinner,
} from "@/components/base";
import {
  KYC_COUNTRIES,
  KYC_GOVERNMENT_ID_TYPES,
  NIGERIAN_STATES,
  toSelectOptions,
} from "@/constants/kycFieldOptions";
import {
  useCreateKycSubmissionMutation,
  useMyKycQuery,
} from "@/hooks/queries/kyc";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";
import authService from "@/services/authService";
import { setUser } from "@/store/slices/auth-slice";
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_UPLOAD_MAX_FILE_SIZE_BYTES,
  type KycSubmission,
  type KycTextFieldDefinition,
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

const BASE_PATH = KYC_ROLE_PATHS[UserRole.DISTRIBUTOR];

/**
 * Tiers whose form lives on the detail page itself (the "Complete Your
 * Verification" panel in the designs) rather than in a dialog, split into
 * ordered steps. Tier 2 asks for the country, then the business details.
 *
 * Stepping is presentation only — the panel accumulates every value and sends
 * them as **one** request, because the server validates the full field set on
 * each submission. A tier listed here renders no dialog at all.
 */
const INLINE_STEPS_BY_TIER: Record<string, string[][]> = {
  registered_distributor: [
    ["countryOfOrigin"],
    ["businessName", "state", "city"],
  ],
};

/**
 * Presentation-only copy overrides keyed by `tierKey`. The server's
 * `tierLabel` / `processingTime` stay authoritative for the API and the admin
 * queue — this only matches what the distributor was shown in the designs.
 */
const DISTRIBUTOR_TIER_COPY: Record<
  string,
  { label?: string; processingTime?: string }
> = {
  verified_distributor: { processingTime: "Processing time 24-48 hours" },
};

/**
 * Field-level overrides. `inputType: "dropdown"` is a frontend-only choice —
 * the value is still sent as a plain string, so no server change is implied.
 */
const FIELD_COPY: Record<
  string,
  {
    label?: string;
    placeholder?: string;
    inputType?: "text" | "dropdown";
    options?: readonly string[];
  }
> = {
  countryOfOrigin: {
    label: "Country of Origin",
    placeholder: "Select Country of Origin",
    inputType: "dropdown",
    options: KYC_COUNTRIES,
  },
  businessName: {
    label: "Business name",
    placeholder: "Enter your business name",
  },
  state: {
    label: "State (what state is your business located?)",
    placeholder: "Select state",
    inputType: "dropdown",
    options: NIGERIAN_STATES,
  },
  city: {
    label: "City (what city is your business located?)",
    placeholder: "Enter city name",
  },
  identityDocumentType: {
    label: "Government Card",
    placeholder: "Select government ID",
    inputType: "dropdown",
    options: KYC_GOVERNMENT_ID_TYPES,
  },
  identityDocumentNumber: {
    label: "ID Number",
    placeholder: "Identification Number",
  },
};

const DOCUMENT_COPY: Record<string, string> = {
  identity_document: "ID card upload",
  business_registration_certificate: "Business Registration Certificate",
  business_registration_report: "Business Registration Report",
};

const tierLabelOf = (tier: KycTierDefinition) =>
  DISTRIBUTOR_TIER_COPY[tier.tierKey]?.label ?? tier.tierLabel;

const tierProcessingTimeOf = (tier: KycTierDefinition) =>
  DISTRIBUTOR_TIER_COPY[tier.tierKey]?.processingTime ?? tier.processingTime;

const fieldLabelOf = (field: KycTextFieldDefinition) =>
  FIELD_COPY[field.fieldName]?.label ?? field.label;

const documentLabelOf = (fieldName: string, fallback: string) =>
  DOCUMENT_COPY[fieldName] ?? fallback;

/* ------------------------------------------------------------------ */
/* Tier state                                                          */
/* ------------------------------------------------------------------ */

/**
 * `pending` covers `submitted`, `under_review` and `draft_submission` — all
 * three block resubmission server-side, so they behave identically and differ
 * only in label. `locked` is distributor-specific: an unmet prerequisite, or
 * an `admin_only` tier that hasn't been awarded.
 */
type TierState =
  | "held" // auto-granted (Basic Distributor)
  | "approved"
  | "pending"
  | "rejected" // the only state that permits a retry
  | "available"
  | "locked";

interface TierView {
  tier: KycTierDefinition;
  state: TierState;
  /** Latest submission for this tier, if any. */
  submission: KycSubmission | null;
  statusLabel: string;
  canSubmit: boolean;
  /** Label of the tier blocking this one, when `state === "locked"`. */
  blockedBy: string | null;
}

const STATUS_STYLES: Record<TierState, string> = {
  held: "bg-[#F3F4F6] text-[#4B5563]",
  approved: "bg-[#E7F7EC] text-[#13A83B]",
  pending: "bg-[#FFF4E5] text-[#E26B0A]",
  rejected: "bg-[#FDECEC] text-[#D92D20]",
  available: "bg-[#EAF2FE] text-[#0669D9]",
  locked: "bg-[#F3F4F6] text-[#6B7280]",
};

const ICON_COLORS: Record<TierState, string> = {
  held: "#6B7280",
  approved: "#13A83B",
  pending: "#FFC000",
  rejected: "#D92D20",
  available: "#6B7280",
  locked: "#9CA3AF",
};

function TierIcon({ view }: { view: TierView }) {
  // Premium keeps its star in every state — it's the tier's identity, not a status.
  if (view.tier.submissionBehavior === "admin_only") {
    return (
      <Star
        size={20}
        className="shrink-0"
        style={{ color: view.state === "approved" ? "#F59E0B" : "#D1D5DB" }}
        fill={view.state === "approved" ? "#F59E0B" : "none"}
        aria-hidden
      />
    );
  }

  return (
    <BadgeCheck
      size={20}
      className="shrink-0"
      style={{ color: ICON_COLORS[view.state] }}
      aria-hidden
    />
  );
}

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
      {state === "locked" ? <Lock size={12} /> : null}
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
  approvedTierKeys: Set<string>,
  labelByTierKey: Map<string, string>,
): TierView => {
  // Auto-granted tiers are held by definition — they have no submission.
  if (tier.submissionBehavior === "none") {
    return {
      tier,
      state: "held",
      submission: null,
      statusLabel: "",
      canSubmit: false,
      blockedBy: null,
    };
  }

  const submission = latestSubmissionFor(submissions, tier.tierKey);
  const prerequisiteMet =
    !tier.prerequisiteTierKey || approvedTierKeys.has(tier.prerequisiteTierKey);
  const blockedBy = prerequisiteMet
    ? null
    : (labelByTierKey.get(tier.prerequisiteTierKey ?? "") ??
      tier.prerequisiteTierKey);

  if (submission) {
    switch (submission.status) {
      case "approved":
        return {
          tier,
          state: "approved",
          submission,
          statusLabel: "Approved",
          canSubmit: false,
          blockedBy: null,
        };
      case "rejected":
        return {
          tier,
          state: "rejected",
          submission,
          statusLabel: "Rejected",
          // A rejection only reopens the tier if the prerequisite still holds.
          canSubmit:
            tier.submissionBehavior === "review_required" && prerequisiteMet,
          blockedBy,
        };
      case "under_review":
        return {
          tier,
          state: "pending",
          submission,
          statusLabel: "Under review",
          canSubmit: false,
          blockedBy: null,
        };
      case "draft_submission":
        return {
          tier,
          state: "pending",
          submission,
          statusLabel: "Awaiting submission",
          canSubmit: false,
          blockedBy: null,
        };
      default:
        return {
          tier,
          state: "pending",
          submission,
          statusLabel: "Pending approval",
          canSubmit: false,
          blockedBy: null,
        };
    }
  }

  // Premium tiers are awarded by Baiy admins — a submission is rejected
  // server-side, so there is never a CTA.
  if (tier.submissionBehavior === "admin_only") {
    return {
      tier,
      state: "locked",
      submission: null,
      statusLabel: "Awarded by Baiy",
      canSubmit: false,
      blockedBy,
    };
  }

  if (!prerequisiteMet) {
    return {
      tier,
      state: "locked",
      submission: null,
      statusLabel: "Locked",
      canSubmit: false,
      blockedBy,
    };
  }

  return {
    tier,
    state: "available",
    submission: null,
    statusLabel: "Not submitted",
    canSubmit: true,
    blockedBy: null,
  };
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

export default function DistributorKycView({
  selectedTierSlug,
}: {
  selectedTierSlug?: string;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: authUser } = useAppSelector((state) => state.auth);
  const token = authUser?.tokens?.accessToken ?? "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineStep, setInlineStep] = useState(0);
  const [submittedTierLabel, setSubmittedTierLabel] = useState<string | null>(null);

  const kycQuery = useMyKycQuery();
  const createSubmission = useCreateKycSubmissionMutation();

  const tiers = useMemo(
    () =>
      (kycQuery.data?.tiers ?? []).toSorted(
        (a, b) => a.tierOrdinal - b.tierOrdinal,
      ),
    [kycQuery.data?.tiers],
  );
  const submissions = useMemo(
    () => kycQuery.data?.submissions ?? [],
    [kycQuery.data?.submissions],
  );

  const tierViews = useMemo(() => {
    const approvedTierKeys = new Set(
      tiers
        .filter((tier) => tier.submissionBehavior === "none")
        .map((tier) => tier.tierKey),
    );

    // A tier counts as approved only via its *latest* submission — an older
    // approved record can't outrank a newer one.
    for (const tier of tiers) {
      if (latestSubmissionFor(submissions, tier.tierKey)?.status === "approved") {
        approvedTierKeys.add(tier.tierKey);
      }
    }

    const labelByTierKey = new Map(
      tiers.map((tier) => [tier.tierKey, tierLabelOf(tier)]),
    );

    return tiers.map((tier) =>
      buildTierView(tier, submissions, approvedTierKeys, labelByTierKey),
    );
  }, [submissions, tiers]);

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

    return held
      ? tierLabelOf(held.tier)
      : (authUser?.kycBadgeLabel ?? "Basic Distributor");
  }, [authUser?.kycBadgeLabel, tierViews]);

  /**
   * Where "Upgrade" points. Only tiers the distributor can actually act on —
   * a locked or admin-only tier would leave the CTA linking nowhere useful.
   */
  const upgradeTarget = useMemo(
    () =>
      tierViews.find((view) => view.state === "rejected" && view.canSubmit) ??
      tierViews.find((view) => view.state === "available") ??
      null,
    [tierViews],
  );

  const hasApproved = submissions.some(
    (submission) => submission.status === "approved",
  );

  // An approval changes the badge globally (and activates the marketplace
  // account at tier 2) — resync the auth profile.
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

  // Moving between tiers restarts the wizard — otherwise you'd land on tier 2
  // already at step 2, carrying values typed against a different tier.
  useEffect(() => {
    setInlineStep(0);
    setInlineError(null);
    setSubmitError(null);
    setTextValues({});
    setFiles({});
  }, [selectedTierSlug]);

  /* ---------------------------------------------------------------- */
  /* Form plumbing                                                     */
  /* ---------------------------------------------------------------- */

  const inlineStepsFor = (tier: KycTierDefinition) =>
    INLINE_STEPS_BY_TIER[tier.tierKey] ?? [];

  /**
   * The definitions for one inline step, in the order the step declares them.
   * Names the server doesn't ask for are dropped, so a catalogue change can
   * only ever shrink a step — never render a field that won't be submitted.
   */
  const stepFieldsFor = (tier: KycTierDefinition, step: number) => {
    const names = inlineStepsFor(tier)[step] ?? [];

    return names
      .map((name) =>
        tier.requiredTextFields.find((field) => field.fieldName === name),
      )
      .filter((field): field is KycTextFieldDefinition => Boolean(field));
  };

  /**
   * Required fields the inline steps don't mention — appended to the final
   * step so a server-side addition can still be filled in and submitted.
   */
  const unstepped = (tier: KycTierDefinition) => {
    const claimed = new Set(inlineStepsFor(tier).flat());
    return tier.requiredTextFields.filter(
      (field) => !claimed.has(field.fieldName),
    );
  };

  const resetForm = (tier: KycTierDefinition) => {
    setTextValues(
      Object.fromEntries(
        tier.requiredTextFields.map((field) => [field.fieldName, ""]),
      ),
    );
    setFiles(
      Object.fromEntries(
        tier.requiredDocuments.map((document) => [document.fieldName, null]),
      ),
    );
    setSubmitError(null);
    setInlineError(null);
  };

  const openDialog = (view: TierView) => {
    if (!view.canSubmit) return;

    resetForm(view.tier);
    setDialogOpen(true);
  };

  /** Advance the inline panel, validating only the step being left. */
  const goToNextStep = (view: TierView) => {
    const missing = stepFieldsFor(view.tier, inlineStep).find(
      (field) => !textValues[field.fieldName]?.trim(),
    );

    if (missing) {
      setInlineError(`${fieldLabelOf(missing)} is required`);
      return;
    }

    setInlineError(null);
    setInlineStep((step) => step + 1);
  };

  const goToPreviousStep = () => {
    setInlineError(null);
    setSubmitError(null);
    setInlineStep((step) => Math.max(0, step - 1));
  };

  const handleSubmit = async (view: TierView) => {
    if (createSubmission.isPending) return;

    setSubmitError(null);

    try {
      const textFields: Record<string, string> = {};

      for (const definition of view.tier.requiredTextFields) {
        const value = textValues[definition.fieldName]?.trim() ?? "";
        if (!value) {
          // Send the user back to the step that owns the empty field —
          // otherwise the error names something they can't see.
          const owningStep = inlineStepsFor(view.tier).findIndex((names) =>
            names.includes(definition.fieldName),
          );
          if (owningStep >= 0) setInlineStep(owningStep);

          throw new Error(`${fieldLabelOf(definition)} is required`);
        }

        textFields[definition.fieldName] = value;
      }

      const documents = [];

      for (const definition of view.tier.requiredDocuments) {
        const file = files[definition.fieldName];
        if (!file) {
          throw new Error(
            `${documentLabelOf(definition.fieldName, definition.label)} is required`,
          );
        }

        const invalid = validateFile(file);
        if (invalid) throw new Error(invalid);

        documents.push({ fieldName: definition.fieldName, file });
      }

      // Text fields and files go up together as one multipart request.
      await createSubmission.mutateAsync({
        tierKey: view.tier.tierKey,
        textFields,
        documents,
      });

      setDialogOpen(false);
      setTextValues({});
      setFiles({});
      setInlineStep(0);
      setSubmittedTierLabel(tierLabelOf(view.tier));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit your details",
      );
    }
  };

  /* ---------------------------------------------------------------- */
  /* Loading / error                                                   */
  /* ---------------------------------------------------------------- */

  // Hooks self-disable without a token — render nothing rather than an error.
  if (!token) return null;

  if (kycQuery.isLoading) {
    return (
      <>
        <Header
          title="Trust & Verification"
          description={KYC_ROLE_DESCRIPTIONS[UserRole.DISTRIBUTOR]}
        />
        <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
          <div className="h-[92px] animate-pulse rounded-2xl border border-[#DDE0E5] bg-white" />
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-[69px] animate-pulse rounded-[10px] bg-white"
            />
          ))}
        </div>
      </>
    );
  }

  if (kycQuery.isError) {
    return (
      <>
        <Header
          title="Trust & Verification"
          description={KYC_ROLE_DESCRIPTIONS[UserRole.DISTRIBUTOR]}
        />
        <div className="bg-[#F9FAFB] p-4 md:p-6">
          <div className="flex flex-col items-start gap-3 rounded-[10px] border border-[#FDA29B] bg-[#FFFBFA] p-6">
            <div className="flex items-center gap-2 text-[#D92D20]">
              <AlertCircle size={18} />
              <p className="text-[14px] font-medium">
                Unable to load your account tiers
              </p>
            </div>
            <p className="text-[13px] leading-5 text-[#4B5563]">
              {kycQuery.error instanceof Error
                ? kycQuery.error.message
                : "Something went wrong."}
            </p>
            <Button
              onClick={() => void kycQuery.refetch()}
              className="mt-1 inline-flex h-[38px] w-auto items-center gap-2 rounded-xl bg-[#0669D9] px-4 text-[13px] text-white"
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
          <Header
            title="Trust & Verification"
            description={KYC_ROLE_DESCRIPTIONS[UserRole.DISTRIBUTOR]}
          />
          <div className="bg-[#F9FAFB] p-4 md:p-6">
            <div className="rounded-[10px] bg-white p-6">
              <p className="text-[15px] font-medium text-black">Tier not found</p>
              <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
                That verification tier doesn&apos;t exist for a distributor account.
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
        <Header
          title="Trust & Verification"
          description={KYC_ROLE_DESCRIPTIONS[UserRole.DISTRIBUTOR]}
        />
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
      <Header
        title="Trust & Verification"
        description={KYC_ROLE_DESCRIPTIONS[UserRole.DISTRIBUTOR]}
      />
      <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
        <section className="flex min-h-[92px] flex-col items-start justify-between gap-3 rounded-2xl border border-[#DDE0E5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-[20px] font-medium leading-8 text-[#111827]">
              Account Tiers
            </h2>
            <p className="text-[14px] leading-5 text-[#4B5563]">
              {KYC_ROLE_INTRO_COPY[UserRole.DISTRIBUTOR]}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-row items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium leading-6 text-[#4B5563]">
                {currentTierLabel}
              </span>
              <BadgeCheck size={20} className="shrink-0 text-[#6B7280]" />
            </div>
            {/* Nothing to link to once every tier is approved or admin-only. */}
            {upgradeTarget ? (
              <Link
                href={`${BASE_PATH}/${upgradeTarget.tier.routeSlug}`}
                className="inline-flex h-[34px] min-w-[107px] items-center justify-center rounded-xl bg-[#0669D9] px-4 text-[12px] leading-[14px] text-white"
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
                    <TierIcon view={view} />
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

    // Auto-granted tier: no submission exists, so show the signup details that
    // earned it instead of an empty document table.
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
              {tierLabelOf(tier)}: Uploaded requirement
            </h3>
            <BadgeCheck size={18} style={{ color: ICON_COLORS.held }} />
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
            View all uploaded requirement
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 border-t border-[#EEF0F3] pt-5 sm:grid-cols-2 lg:max-w-[520px]">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-[12px] leading-4 text-[#9CA3AF]">
                  {field.label}
                </dt>
                <dd className="mt-1 break-words text-[14px] leading-5 text-black">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }

    const documents = submission?.documents ?? [];
    // The inline "Complete Your Verification" panel only makes sense while the
    // tier is actually submittable.
    const showInlinePanel = inlineStepsFor(tier).length > 0 && view.canSubmit;

    return (
      <section className="rounded-[10px] bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-medium leading-6 text-black">
                {tierLabelOf(tier)}: Uploaded requirement
              </h3>
              <TierIcon view={view} />
            </div>
            <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
              View all uploaded requirement
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <StatusPill state={state} label={view.statusLabel} />
            {/* CTA lives in the inline panel for tiers that have one. */}
            {view.canSubmit && !showInlinePanel ? (
              <Button
                onClick={() => openDialog(view)}
                className="inline-flex h-[38px] w-auto items-center justify-center rounded-xl bg-[#0669D9] px-4 text-[13px] text-white"
              >
                {state === "rejected" ? "Resubmit" : "Upgrade"}
              </Button>
            ) : null}
          </div>
        </div>

        {/* A rejection is the only state the distributor can act on — lead with why. */}
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
              <p className="mt-2 text-[12px] leading-4 text-[#6B7280]">
                Re-upload every required item — a retry replaces the whole
                submission, not just the item that failed.
              </p>
            </div>
          </div>
        ) : null}

        {state === "pending" ? (
          <p className="mt-4 rounded-[8px] bg-[#FFF9F0] p-3 text-[13px] leading-5 text-[#8A5A00]">
            Your details are with our review team. Nothing is needed from you
            right now — this page updates on its own once a decision is made.
          </p>
        ) : null}

        {/* Prerequisite chain: say exactly which tier is blocking. */}
        {state === "locked" && tier.submissionBehavior === "review_required" ? (
          <p className="mt-4 flex items-start gap-2 rounded-[8px] bg-[#F3F4F6] p-3 text-[13px] leading-5 text-[#4B5563]">
            <Lock size={14} className="mt-0.5 shrink-0" />
            <span>
              Get <span className="font-medium">{view.blockedBy}</span> approved
              first — this tier opens up once that one is cleared.
            </span>
          </p>
        ) : null}

        {tier.submissionBehavior === "admin_only" && state !== "approved" ? (
          <p className="mt-4 flex items-start gap-2 rounded-[8px] bg-[#FFFBEB] p-3 text-[13px] leading-5 text-[#92400E]">
            <Star size={14} className="mt-0.5 shrink-0" />
            <span>
              {tierLabelOf(tier)} is awarded by Baiy administrators — there is
              nothing to submit.
              {view.blockedBy
                ? ` It is only considered once ${view.blockedBy} is approved.`
                : ""}
            </span>
          </p>
        ) : null}

        {/* Submitted text values, once there is a submission to show. */}
        {submission && tier.requiredTextFields.length ? (
          <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 border-t border-[#EEF0F3] pt-5 sm:grid-cols-2 lg:max-w-[640px]">
            {tier.requiredTextFields.map((field) => (
              <div key={field.fieldName}>
                <dt className="text-[12px] leading-4 text-[#9CA3AF]">
                  {field.label}
                </dt>
                <dd className="mt-1 break-words text-[14px] leading-5 text-black">
                  {submission.textFields?.[field.fieldName] || "-"}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {showInlinePanel ? renderInlinePanel(view) : null}

        {tier.requiredDocuments.length
          ? renderDocuments(view, documents)
          : null}
      </section>
    );
  }

  /**
   * "Complete Your Verification" — the whole form for inline tiers, walked one
   * step at a time. The last step submits; there is no dialog for these tiers.
   */
  function renderInlinePanel(view: TierView) {
    const steps = inlineStepsFor(view.tier);
    const stepCount = steps.length;
    // Clamp: a catalogue change could leave `inlineStep` past the end.
    const step = Math.min(inlineStep, stepCount - 1);
    const isLastStep = step === stepCount - 1;
    const busy = createSubmission.isPending;

    const definitions = [
      ...stepFieldsFor(view.tier, step),
      // Anything the step map doesn't claim rides along on the final step.
      ...(isLastStep ? unstepped(view.tier) : []),
    ];

    return (
      <div className="mt-5 rounded-[12px] border border-[#EEF2F8] bg-[#FCFDFE] p-4 md:p-5 lg:max-w-[420px]">
        <div
          className="mb-4 flex gap-2"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={stepCount}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${stepCount}`}
        >
          {steps.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 w-9 rounded-full",
                index <= step ? "bg-[#FF7A00]" : "bg-[#FFD9B5]",
              )}
            />
          ))}
        </div>

        <h4 className="text-[17px] font-medium leading-6 text-black">
          Complete Your Verification
        </h4>
        <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
          Business key information
        </p>

        <div className="mt-5 space-y-4">
          {definitions.map((field) => renderTextControl(field))}
        </div>

        {inlineError || submitError ? (
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-4 text-[#B42318]">
            <AlertCircle size={13} className="mt-px shrink-0" />
            {inlineError ?? submitError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          {step > 0 ? (
            <Button
              variant="primaryLight"
              onClick={goToPreviousStep}
              disabled={busy}
              iconLeft={<ArrowLeft size={16} />}
              className="h-[44px] rounded-[8px] text-[14px] sm:w-auto sm:px-5"
            >
              Back
            </Button>
          ) : null}

          {isLastStep ? (
            <Button
              onClick={() => void handleSubmit(view)}
              disabled={busy}
              className="h-[44px] rounded-[8px] bg-[#0669D9] text-[14px] text-white disabled:opacity-60"
            >
              {busy ? <Spinner /> : null}
              {busy ? "Submitting..." : "Submit"}
            </Button>
          ) : (
            <Button
              onClick={() => goToNextStep(view)}
              iconRight={<ChevronRight size={18} />}
              className="h-[44px] rounded-[8px] bg-[#0669D9] text-[14px] text-white"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }

  /** Shared text/dropdown control, applying the frontend-only overrides. */
  function renderTextControl(field: KycTextFieldDefinition) {
    const copy = FIELD_COPY[field.fieldName] ?? {};
    const label = fieldLabelOf(field);
    const placeholder =
      copy.placeholder ?? `Enter ${field.label.toLowerCase()}`;
    const value = textValues[field.fieldName] ?? "";

    // The state list is Nigeria-only — anywhere else has to be free text or
    // the distributor simply cannot complete the form.
    const stateNeedsFreeText =
      field.fieldName === "state" &&
      (textValues.countryOfOrigin ?? "") !== "Nigeria";

    const asDropdown =
      (copy.inputType ?? field.inputType) === "dropdown" &&
      (copy.options?.length || field.options?.length) &&
      !stateNeedsFreeText;

    if (asDropdown) {
      return (
        <SingleSelect
          key={field.fieldName}
          label={label}
          // Radix clears on `undefined`, not `""` — "" would suppress the placeholder.
          value={value || undefined}
          onValueChange={(next) => {
            setTextValues((current) => ({
              ...current,
              [field.fieldName]: next,
              // Switching country invalidates a Nigeria-specific state.
              ...(field.fieldName === "countryOfOrigin" ? { state: "" } : {}),
            }));
            setInlineError(null);
            setSubmitError(null);
          }}
          options={toSelectOptions(copy.options ?? field.options ?? [])}
          placeholder={placeholder}
        />
      );
    }

    return (
      <Input
        key={field.fieldName}
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setTextValues((current) => ({ ...current, [field.fieldName]: next }));
          setInlineError(null);
          setSubmitError(null);
        }}
      />
    );
  }

  function renderDocuments(
    view: TierView,
    documents: KycSubmission["documents"],
  ) {
    const { tier, state } = view;

    if (!documents.length) {
      return (
        <div className="mt-5 rounded-[8px] border border-dashed border-[#DDE0E5] p-6 text-center">
          <p className="text-[14px] leading-5 text-black">
            You haven&apos;t uploaded any documents for this tier yet.
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
            Required:{" "}
            {tier.requiredDocuments
              .map((document) =>
                documentLabelOf(document.fieldName, document.label),
              )
              .join(", ")}
            .
          </p>
        </div>
      );
    }

    return (
      <div className="mt-5 rounded-[10px] border border-[#EEF2F8] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-[15px] font-medium leading-6 text-black">
            Uploaded documents
          </h4>
          {/* Registered Distributor has no badge by design — only show a real one. */}
          {tier.badgeLabel && state === "approved" ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] leading-5 text-[#4B5563]">
              <span className="font-medium text-black">Badge:</span>
              {tier.badgeLabel}
              <BadgeCheck size={16} className="text-[#13A83B]" />
            </span>
          ) : null}
        </div>

        <div className="mt-3 overflow-x-auto">
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
              {documents.map((document, index) => {
                const definition = tier.requiredDocuments.find(
                  (candidate) => candidate.fieldName === document.fieldName,
                );

                return (
                  <tr
                    // A field can repeat (multi-file requirements), so the URL
                    // alone isn't a stable key.
                    key={`${document.fieldName}-${document.cloudinaryId || index}`}
                    className="h-[46px] border-b border-[#F1F3F5] text-[13px] leading-5 text-black"
                  >
                    <td className="px-3">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[#EAF7EE] text-[#16A34A]">
                          <FileText size={14} />
                        </span>
                        <span className="truncate">
                          {definition
                            ? documentLabelOf(
                                definition.fieldName,
                                definition.label,
                              )
                            : document.fileName}
                        </span>
                      </span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderUploadDialog(view: TierView) {
    // Inline tiers carry their whole form on the page — no dialog exists.
    if (inlineStepsFor(view.tier).length > 0) return null;

    const busy = createSubmission.isPending;
    const fields = view.tier.requiredTextFields;

    return (
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          // Closing mid-flight orphans a multipart upload — refuse it.
          if (busy) return;
          setDialogOpen(open);
          if (!open) setSubmitError(null);
        }}
      >
        <DialogContent className="max-h-[88vh] w-[92vw] max-w-[420px] overflow-y-auto rounded-[12px] bg-white p-5">
          <DialogHeader>
            <DialogTitle className="pr-6 text-left text-[15px] font-medium leading-6 text-black">
              Enter information below to upgrade Verification status.
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {view.tier.requiredDocuments.length ? (
              <p className="text-[13px] leading-5 text-[#4B5563]">
                Input information details to become a{" "}
                {tierLabelOf(view.tier).toLowerCase()}
              </p>
            ) : null}

            {fields.map((field) => renderTextControl(field))}

            {view.tier.requiredDocuments.map((definition) => {
              const file = files[definition.fieldName] ?? null;
              const label = documentLabelOf(
                definition.fieldName,
                definition.label,
              );

              return (
                <div key={definition.fieldName}>
                  <p className="mb-1.5 text-[13px] leading-5 text-[#4B5563]">
                    {label}
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

                        // Catch size/format at selection — a far better error
                        // than a 400 after a long upload.
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
                        <FileText size={20} className="mb-1 text-[#9CA3AF]" />
                        <span className="text-[12px] leading-4 text-[#FF7A00]">
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

            <p className="text-[11px] leading-4 text-[#FF7A00]">
              Note: Document should be clear and a supported file format, 5MB or
              smaller.
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
              className="h-[44px] rounded-[8px] bg-[#0669D9] text-[14px] text-white disabled:opacity-60"
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
            Details submitted
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
            Your {submittedTierLabel} upgrade is pending approval. Check back
            here — this page updates on its own once the review is complete.
          </p>
          <Button
            onClick={() => setSubmittedTierLabel(null)}
            className="mt-5 h-[42px] rounded-[8px] bg-[#0669D9] text-[14px] text-white"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }
}
