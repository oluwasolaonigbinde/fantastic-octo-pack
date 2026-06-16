"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  SingleSelect,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";
import authService from "@/services/authService";
import kycService from "@/services/kycService";
import { setUser } from "@/store/slices/auth-slice";
import type { KycSubmission, KycTierDefinition } from "@/types/kyc";
import { UserRole, type UserData } from "@/types/user";

import { getKycFileTypeLabel } from "@/utils/kycFileTypeLabel";

import {
  buildBaseReadOnlyFields,
  KYC_ROLE_DESCRIPTIONS,
  KYC_ROLE_INTRO_COPY,
  KYC_ROLE_PATHS,
  KYC_UPLOAD_ACCEPT,
  KYC_UPLOAD_FORMAT_LABEL,
} from "./config";

type SupportedRole =
  | UserRole.BUYER
  | UserRole.DISTRIBUTOR
  | UserRole.OEM
  | UserRole.ENGINEER;

type TierStatus = "approved" | "pending" | "rejected" | "available" | "locked";
type FileMap = Record<string, File | null>;
type SubmissionFeedback = {
  tierLabel: string;
  status: "approved" | "submitted";
};

interface SubmitterKycViewProps {
  role: SupportedRole;
  selectedTierSlug?: string;
}

const STATUS_STYLES: Record<TierStatus, string> = {
  approved: "bg-[#E8F9EF] text-[#1F9254]",
  pending: "bg-[#FFF4E8] text-[#D87C1D]",
  rejected: "bg-[#FFE8E8] text-[#D64545]",
  available: "bg-[#EEF5FF] text-[#2F6BFF]",
  locked: "bg-gray7 text-gray3",
};

const STATUS_LABELS: Record<TierStatus, string> = {
  approved: "Approved",
  pending: "Submitted for review",
  rejected: "Rejected",
  available: "Upgrade",
  locked: "",
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
};

const formatDocumentDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

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
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = String(hours % 12 || 12).padStart(2, "0");

  return `${day}${suffix} ${month} ${year} - ${displayHour}:${minutes}${period}`;
};

const getLatestSubmission = (
  submissions: KycSubmission[],
  tierKey: string,
): KycSubmission | null => {
  const matches = submissions
    .filter((submission) => submission.tierKey === tierKey)
    .toSorted((a, b) => {
      const aTime = new Date(a.submittedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.submittedAt ?? b.createdAt ?? 0).getTime();

      return aTime - bTime;
    });

  return matches.at(-1) ?? null;
};

const orderedStatuses = (
  tiers: KycTierDefinition[],
  submissions: KycSubmission[],
): TierStatus[] => {
  const approvedTierKeys = new Set(
    submissions
      .filter((submission) => submission.status === "approved")
      .map((submission) => submission.tierKey),
  );

  return tiers.map((tier, index) => {
    const submission = getLatestSubmission(submissions, tier.tierKey);

    if (submission?.status === "approved") {
      return "approved";
    }

    if (submission?.status === "submitted") {
      return "pending";
    }

    if (submission?.status === "rejected") {
      return "rejected";
    }

    if (tier.isAutoGranted) {
      return "approved";
    }

    if (index === 0) {
      return "available";
    }

    const previousTier = tiers[index - 1];
    const previousTierApproved = previousTier
      ? previousTier.isAutoGranted || approvedTierKeys.has(previousTier.tierKey)
      : false;

    return previousTierApproved ? "available" : "locked";
  });
};

const labelForTextField = (tier: KycTierDefinition, fieldName: string) =>
  tier.requiredTextFields.find((field) => field.fieldName === fieldName)?.label ?? fieldName;

const buyerTierIconColors = ["#6B7280", "#13A83B", "#FFC000"];
const engineerTierIconColors = ["", "#65758B", "#0967D9", "#C17C2C", "#E26B0A"];

const formatEngineerBadgeLabel = (label: string) =>
  label.replace(/^Basic /, "").replace(/^Verified /, "").replace(/^Certified /, "").replace(/^Elite /, "");

const getDocumentLabel = (tier: KycTierDefinition, fieldName: string) =>
  tier.requiredDocuments.find((document) => document.fieldName === fieldName)?.label ?? fieldName;

const getInitials = (user: UserData | null) => {
  const first = user?.firstName?.[0] ?? "";
  const last = user?.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "SE";
};

function TierBadge({ status }: { status: TierStatus }) {
  const label = STATUS_LABELS[status];

  if (!label) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status === "approved" ? <CheckCircle2 size={12} /> : null}
      {status === "pending" ? <Clock3 size={12} /> : null}
      {label}
    </span>
  );
}

export default function SubmitterKycView({
  role,
  selectedTierSlug,
}: SubmitterKycViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: authUser } = useAppSelector((state) => state.auth);
  const token = authUser?.tokens?.accessToken ?? "";

  const [tiers, setTiers] = useState<KycTierDefinition[]>([]);
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<KycTierDefinition | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inlineCountry, setInlineCountry] = useState("Nigeria");
  const [submissionFeedback, setSubmissionFeedback] = useState<SubmissionFeedback | null>(null);

  const refreshAuthProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser(token);
      if (
        currentUser.kycBadgeLabel === authUser?.kycBadgeLabel &&
        currentUser.engineerTierLabel === authUser?.engineerTierLabel
      ) {
        return;
      }

      dispatch(
        setUser({
          ...currentUser,
          tokens: authUser?.tokens ?? currentUser.tokens,
        }),
      );
    } catch {
      // KYC status remains usable even if the global profile refresh is unavailable.
    }
  }, [authUser, dispatch, token]);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) {
      return;
    }

    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [tiersResponse, submissionsResponse] = await Promise.all([
        kycService.getTiers(token),
        kycService.getSubmissions(token),
      ]);

      setTiers(tiersResponse.data);
      setSubmissions(submissionsResponse.data);

      if (submissionsResponse.data.some((submission) => submission.status === "approved")) {
        await refreshAuthProfile();
      }
    } catch (fetchError) {
      if (!silent) {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load KYC data");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [refreshAuthProfile, token]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const tierStatuses = useMemo(
    () => orderedStatuses(tiers, submissions),
    [tiers, submissions],
  );

  const tierStatusMap = useMemo(
    () =>
      Object.fromEntries(
        tiers.map((tier, index) => [tier.tierKey, tierStatuses[index] ?? "locked"]),
      ) as Record<string, TierStatus>,
    [tierStatuses, tiers],
  );

  const hasPendingSubmission = useMemo(
    () => submissions.some((submission) => submission.status === "submitted"),
    [submissions],
  );

  useEffect(() => {
    if (!token || !hasPendingSubmission) {
      return;
    }

    const refreshPendingStatus = () => {
      if (document.visibilityState === "visible") {
        void fetchData({ silent: true });
      }
    };

    const intervalId = window.setInterval(refreshPendingStatus, 15000);

    window.addEventListener("focus", refreshPendingStatus);
    document.addEventListener("visibilitychange", refreshPendingStatus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshPendingStatus);
      document.removeEventListener("visibilitychange", refreshPendingStatus);
    };
  }, [fetchData, hasPendingSubmission, token]);

  const currentAccountTierLabel = useMemo(() => {
    if (role !== UserRole.BUYER && role !== UserRole.ENGINEER) {
      return null;
    }

    const approvedTier = tiers
      .filter((tier) => tierStatusMap[tier.tierKey] === "approved")
      .toSorted((a, b) => b.tierOrdinal - a.tierOrdinal)[0];

    if (role === UserRole.ENGINEER) {
      return approvedTier?.tierLabel || authUser?.engineerTierLabel || authUser?.kycBadgeLabel || "Unverified";
    }

    return approvedTier?.tierLabel || authUser?.kycBadgeLabel || "Basic Buyer";
  }, [authUser?.engineerTierLabel, authUser?.kycBadgeLabel, role, tierStatusMap, tiers]);

  const accountUpgradeHref = useMemo(() => {
    if (role !== UserRole.BUYER && role !== UserRole.ENGINEER) {
      return null;
    }

    const nextTier =
      tiers.find((tier) => tierStatusMap[tier.tierKey] === "rejected") ??
      tiers.find((tier) => tierStatusMap[tier.tierKey] === "available") ??
      tiers.find((tier) => tierStatusMap[tier.tierKey] === "pending") ??
      tiers.find((tier) => tier.tierLabel === currentAccountTierLabel) ??
      tiers[0];

    return nextTier ? `${KYC_ROLE_PATHS[role]}/${nextTier.routeSlug}` : KYC_ROLE_PATHS[role];
  }, [currentAccountTierLabel, role, tierStatusMap, tiers]);

  const selectedTier = useMemo(
    () => tiers.find((tier) => tier.routeSlug === selectedTierSlug) ?? null,
    [selectedTierSlug, tiers],
  );

  const openSubmissionDialog = (tier: KycTierDefinition) => {
    setActiveTier(tier);
    setDialogOpen(true);
    setTextValues(
      Object.fromEntries(tier.requiredTextFields.map((field) => [field.fieldName, ""])),
    );
    setFiles(
      Object.fromEntries(tier.requiredDocuments.map((document) => [document.fieldName, null])),
    );
    setSubmitError(null);
  };

  const submitTier = async (
    tier: KycTierDefinition,
    payloadTextFields: Record<string, string>,
  ) => {
    if (!token || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const uploadedDocuments = [];

      for (const documentDefinition of tier.requiredDocuments) {
        const file = files[documentDefinition.fieldName];
        if (!file) {
          throw new Error(`${documentDefinition.label} is required`);
        }

        const uploaded = await kycService.uploadDocument(token, file);
        uploadedDocuments.push({
          fieldName: documentDefinition.fieldName,
          fileName: uploaded.data.fileName,
          fileType: uploaded.data.fileType,
          fileUrl: uploaded.data.fileUrl,
          cloudinaryId: uploaded.data.cloudinaryId,
        });
      }

      const response = await kycService.createSubmission(token, {
        tierKey: tier.tierKey,
        textFields: payloadTextFields,
        documents: uploadedDocuments,
      });

      setDialogOpen(false);
      setSubmissionFeedback({
        tierLabel: tier.tierLabel,
        status: response.data.status === "approved" ? "approved" : "submitted",
      });
      setActiveTier(null);
      await fetchData();
    } catch (submitTierError) {
      setSubmitError(
        submitTierError instanceof Error
          ? submitTierError.message
          : "Unable to submit KYC information",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlineCountrySubmit = async () => {
    if (submitting) {
      return;
    }

    const basicTier = tiers.find((tier) => tier.tierKey === "basic_seller");
    if (!basicTier) {
      return;
    }

    await submitTier(basicTier, { countryOfOrigin: inlineCountry });
    router.push(`${KYC_ROLE_PATHS[role]}/registered-seller`);
  };

  const renderList = () => (
    <>
      <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
      <div className="space-y-4 bg-[#F9FAFB] p-4 md:pb-6 md:pl-6 md:pr-4 md:pt-4">
        <section className="flex min-h-[92px] items-center justify-between gap-6 rounded-2xl border border-[#DDE0E5] bg-white px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-medium leading-8 text-[#111827]">Account Tiers</h2>
            <p className="text-[14px] leading-5 text-[#4B5563]">{KYC_ROLE_INTRO_COPY[role]}</p>
          </div>
          {currentAccountTierLabel ? (
            <div className="hidden w-[107px] shrink-0 flex-col items-start gap-0.5 sm:flex">
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] font-medium leading-6 text-[#4B5563]">
                  {currentAccountTierLabel}
                </span>
                <BadgeCheck size={20} className="shrink-0 text-[#6B7280]" />
              </div>
              <Link
                href={accountUpgradeHref ?? KYC_ROLE_PATHS[role]}
                className="inline-flex h-[34px] w-[107px] items-center justify-center rounded-xl bg-[#0669D9] text-[10px] leading-[14px] text-white"
              >
                Upgrade
              </Link>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          {tiers.map((tier, index) => {
            const status = tierStatusMap[tier.tierKey] ?? "locked";
            const detailHref = `${KYC_ROLE_PATHS[role]}/${tier.routeSlug}`;
            const tierIconColor =
              role === UserRole.BUYER
                ? buyerTierIconColors[index] ?? "#6B7280"
                : role === UserRole.ENGINEER
                  ? engineerTierIconColors[index] ?? "#65758B"
                : status === "approved"
                  ? "#13A83B"
                  : status === "pending"
                    ? "#FFC000"
                    : "#6B7280";
            const showTierIcon = role !== UserRole.ENGINEER || index > 0;
            const showProcessingTime = role !== UserRole.ENGINEER && tier.processingTime;

            return (
              <article
                key={tier.tierKey}
                className="flex min-h-[69px] flex-col items-start justify-between gap-3 overflow-hidden rounded-[10px] bg-white px-[10px] py-4 sm:flex-row sm:items-center sm:gap-4 sm:py-0"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
                  <div className="flex shrink-0 items-center gap-[9px]">
                    <span className="text-[16px] font-normal leading-6 text-black">
                      {tier.tierLabel}
                    </span>
                    {showTierIcon ? (
                      <BadgeCheck
                        size={20}
                        className="shrink-0"
                        style={{ color: tierIconColor }}
                      />
                    ) : null}
                  </div>
                  {showProcessingTime ? (
                    <span className="w-full text-[13px] font-normal leading-5 text-black sm:w-auto sm:truncate sm:text-[14px]">
                      ({tier.processingTime})
                    </span>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
                  <TierBadge status={status} />
                  <Link
                    href={detailHref}
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
    </>
  );

  const renderEngineerDocumentTable = (
    tier: KycTierDefinition,
    submission: KycSubmission | null,
  ) => {
    const documents = submission?.documents ?? [];

    return (
      <div className="min-w-0 flex-1 rounded-[8px] bg-white p-4">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[14px] font-medium leading-5 text-black">Uploaded documents</h3>
          <div className="flex items-center gap-1 text-[12px] leading-4 text-black">
            <span>Badge:</span>
            <span className="inline-flex items-center gap-1 text-[#0669D9]">
              {tier.badgeLabel}
              <BadgeCheck size={14} color={engineerTierIconColors[tier.tierOrdinal - 1] || "#0669D9"} />
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[16%]" />
              <col className="w-[28%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="h-[34px] bg-[#FAFBFC] text-[12px] font-normal leading-4 text-[#4B5563]">
                <th className="px-2 font-normal md:px-3">Document name</th>
                <th className="px-2 font-normal md:px-3">Type</th>
                <th className="px-2 font-normal md:px-3">
                  Date<span className="hidden sm:inline"> uploaded</span>
                </th>
                <th className="px-2 text-center font-normal md:px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.length ? (
                documents.map((document) => (
                  <tr
                    key={document.fieldName}
                    className="h-[38px] border-b border-[#EEF1F5] text-[12px] leading-4 text-black last:border-b-0"
                  >
                    <td className="truncate px-2 md:px-3">{getDocumentLabel(tier, document.fieldName)}</td>
                    <td className="px-2 md:px-3">
                      {getKycFileTypeLabel(document.fileType, document.fileName)}
                    </td>
                    <td className="px-2 md:px-3">{formatDate(document.uploadedAt)}</td>
                    <td className="px-2 md:px-3">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mx-auto flex size-6 items-center justify-center rounded-full text-[#0669D9]"
                        aria-label={`View ${getDocumentLabel(tier, document.fieldName)}`}
                      >
                        <Eye size={14} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="h-[56px] text-[12px] text-[#6B7280]">
                  <td className="px-2 md:px-3" colSpan={4}>
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBuyerDocumentTable = (
    tier: KycTierDefinition,
    submission: KycSubmission,
  ) => (
    <div className="mt-6 max-w-[728px] overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[31%]" />
          <col className="w-[23%]" />
          <col className="w-[33%]" />
          <col className="w-[13%]" />
        </colgroup>
        <thead>
          <tr className="h-10 bg-[#FAFBFC] text-[17px] font-normal leading-6 text-[#65758B]">
            <th className="rounded-l-[8px] px-3 font-normal">Document name</th>
            <th className="px-3 font-normal">Type</th>
            <th className="px-3 font-normal">Date uploaded</th>
            <th className="rounded-r-[8px] px-3 font-normal">Action</th>
          </tr>
        </thead>
        <tbody>
          {submission.documents.map((document) => (
            <tr
              key={document.fieldName}
              className="h-12 border-b border-[#EEF1F5] text-[15px] font-normal leading-6 text-[#111827] last:border-b-0"
            >
              <td className="truncate px-3">{getDocumentLabel(tier, document.fieldName)}</td>
              <td className="px-3">{getKycFileTypeLabel(document.fileType, document.fileName)}</td>
              <td className="px-3">{formatDocumentDateTime(document.uploadedAt)}</td>
              <td className="px-3">
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-8 items-center justify-center text-[#111827]"
                  aria-label={`View ${getDocumentLabel(tier, document.fieldName)}`}
                >
                  <Eye size={20} strokeWidth={1.8} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEngineerDetail = (selectedTier: KycTierDefinition) => {
    const submission = getLatestSubmission(submissions, selectedTier.tierKey);
    const status = tierStatusMap[selectedTier.tierKey] ?? "locked";
    const user = (authUser as UserData | null) ?? null;
    const canOpenUpgrade =
      status === "available" && selectedTier.submissionBehavior !== "none";
    const canSubmitAgain = submission?.status === "rejected";
    const hasSubmittedData = Boolean(submission);

    if (selectedTier.tierKey === "unverified") {
      const fields = buildBaseReadOnlyFields(role, user).map((field) =>
        field.label === "Email address" ? { ...field, label: "First email address" } : field,
      );

      return (
        <>
          <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
          <div className="min-h-[calc(100vh-90px)] bg-[#F9FAFB] p-4 md:px-6 md:py-4">
            <Link
              href={KYC_ROLE_PATHS[role]}
              className="mb-4 inline-flex items-center gap-2 text-[14px] leading-5 text-black"
            >
              <ArrowLeft size={16} />
              Go Back
            </Link>

            <section className="min-h-[286px] rounded-[16px] border border-[#DDE0E5] bg-white p-6 md:p-8">
              <h2 className="text-[16px] font-medium leading-6 text-black">Unverified</h2>
              <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
                View all uploaded requirement
              </p>

              <div className="mt-8 grid max-w-[620px] gap-x-14 gap-y-7 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.label}>
                    <p className="text-[12px] leading-4 text-[#6B7280]">{field.label}</p>
                    <p className="mt-2 text-[13px] leading-5 text-black">{field.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      );
    }

    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
        <div className="min-h-[calc(100vh-90px)] bg-[#F9FAFB] p-4 md:px-6 md:py-4">
          <Link
            href={KYC_ROLE_PATHS[role]}
            className="mb-4 inline-flex items-center gap-2 text-[14px] leading-5 text-black"
          >
            <ArrowLeft size={16} />
            Go Back
          </Link>

          <section className="flex flex-col gap-4 rounded-[16px] bg-transparent md:flex-row">
            <aside className="w-full shrink-0 rounded-[8px] bg-white p-4 md:w-[260px]">
              <h2 className="text-[16px] font-medium leading-6 text-black">{selectedTier.tierLabel}</h2>
              <p className="text-[12px] leading-4 text-[#6B7280]">
                {hasSubmittedData
                  ? "View all uploaded requirement"
                  : "Requirements are available when this tier unlocks."}
              </p>

              <div className="mt-5 flex aspect-[1.1] w-full items-center justify-center overflow-hidden rounded-[4px] bg-[#EAF3FB]">
                {user?.displayPhoto?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.displayPhoto.url}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[32px] font-medium text-[#486581]">{getInitials(user)}</span>
                )}
              </div>

              <dl className="mt-4 space-y-3 text-[12px] leading-4">
                {hasSubmittedData ? selectedTier.requiredTextFields.map((field) => (
                  <div key={field.fieldName}>
                    <dt className="text-[#6B7280]">{field.label}</dt>
                    <dd className="mt-1 text-black">{submission?.textFields[field.fieldName] || "-"}</dd>
                  </div>
                )) : (
                  <div>
                    <dt className="text-[#6B7280]">Status</dt>
                    <dd className="mt-1 text-black">
                      {status === "locked" ? "Locked" : "Not submitted"}
                    </dd>
                  </div>
                )}
                {status === "approved" ? (
                  <div>
                    <dt className="text-[#6B7280]">Badge</dt>
                    <dd className="mt-1 inline-flex items-center gap-1 text-black">
                      {formatEngineerBadgeLabel(selectedTier.badgeLabel)}
                      <BadgeCheck
                        size={14}
                        color={engineerTierIconColors[selectedTier.tierOrdinal - 1] || "#0669D9"}
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </aside>

            {hasSubmittedData ? (
              renderEngineerDocumentTable(selectedTier, submission)
            ) : (
              <div className="min-w-0 flex-1 rounded-[8px] bg-white p-5">
                <h3 className="text-[14px] font-medium leading-5 text-black">
                  {status === "locked" ? "Tier locked" : "Not submitted"}
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-[#6B7280]">
                  {status === "locked"
                    ? "Complete and receive approval for the previous tier before submitting these requirements."
                    : "No KYC information has been submitted for this tier yet."}
                </p>
              </div>
            )}
          </section>

          {submission?.rejectionReason ? (
            <div className="mt-4 rounded-[14px] bg-[#FFF0F0] p-4 text-[13px] text-[#C24141]">
              <p className="font-medium">Reason for rejection</p>
              <p className="mt-1">{submission.rejectionReason}</p>
            </div>
          ) : null}

          {canOpenUpgrade || canSubmitAgain ? (
            <div className="mt-6 max-w-[220px]">
              <Button
                title={canSubmitAgain ? "Submit again" : "Upgrade"}
                disabled={submitting}
                onClick={() => openSubmissionDialog(selectedTier)}
              />
            </div>
          ) : null}
        </div>
      </>
    );
  };

  const renderDetail = () => {
    if (!selectedTier) {
      return (
        <>
          <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
          <div className="p-6 text-sm text-danger">KYC tier not found.</div>
        </>
      );
    }

    if (role === UserRole.ENGINEER) {
      return renderEngineerDetail(selectedTier);
    }

    const submission = getLatestSubmission(submissions, selectedTier.tierKey);
    const status = tierStatusMap[selectedTier.tierKey] ?? "locked";
    const shouldShowBaseProfileFields =
      selectedTier.submissionBehavior === "none" || role === UserRole.BUYER;
    const isBuyerDetail = role === UserRole.BUYER;
    const readOnlyFields = submission
      ? selectedTier.requiredTextFields.map((field) => ({
          label: field.label,
          value: submission.textFields[field.fieldName] || "-",
        }))
      : shouldShowBaseProfileFields
        ? buildBaseReadOnlyFields(role, (authUser as UserData | null) ?? null)
        : [];
    const canOpenUpgrade =
      status === "available" &&
      selectedTier.submissionBehavior !== "none" &&
      selectedTier.tierKey !== "basic_seller";
    const showInlineCountryCard =
      selectedTier.tierKey === "basic_seller" && submission === null;
    const buyerHasDocumentSubmission = isBuyerDetail && Boolean(submission?.documents?.length);

    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
        <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
          <Link
            href={KYC_ROLE_PATHS[role]}
            className="inline-flex items-center gap-2 text-sm text-gray2"
          >
            <ArrowLeft size={16} />
            Go Back
          </Link>

          <section
            className={cn(
              "border border-[#E8ECF4] bg-white p-5 shadow-sm",
              isBuyerDetail
                ? "min-h-[286px] rounded-[12px] md:px-4 md:py-6"
                : "rounded-[24px]",
            )}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2
                  className={cn(
                    "text-gray1",
                    isBuyerDetail
                      ? "inline-flex items-center gap-3 text-[20px] font-medium leading-7"
                      : "text-2xl font-semibold",
                  )}
                >
                  {selectedTier.detailTitle}
                  {isBuyerDetail && status === "approved" ? (
                    <BadgeCheck size={18} className="text-[#6B7280]" />
                  ) : null}
                </h2>
                <p className="text-sm text-gray3">{selectedTier.detailSubtitle}</p>
              </div>
              {isBuyerDetail ? (
                status === "pending" ? (
                  <span className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[8px] bg-[#FF6B00] px-5 text-[16px] font-normal leading-6 text-white">
                    <CheckCircle2 size={16} fill="currentColor" strokeWidth={2.4} />
                    Pending approval
                  </span>
                ) : null
              ) : (
                <TierBadge status={status} />
              )}
            </div>

            {readOnlyFields.length ? (
              <div
                className={cn(
                  "mt-8 grid gap-5 sm:grid-cols-2",
                  isBuyerDetail ? "max-w-[560px] gap-x-20 gap-y-5" : "lg:grid-cols-3",
                )}
              >
                {readOnlyFields.map((field) => (
                  <div key={field.label}>
                    <p className="text-sm text-gray3">{field.label}</p>
                    <p className="mt-2 text-lg text-gray2">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : buyerHasDocumentSubmission ? null : (
              <div className="mt-8 rounded-[20px] border border-dashed border-[#D9E2F0] bg-[#F8FAFC] p-5 text-sm text-gray3">
                <p className="font-medium text-gray1">
                  {status === "locked"
                    ? "This tier is locked"
                    : status === "rejected"
                      ? "This tier was rejected"
                      : "This tier has not been submitted"}
                </p>
                <p className="mt-2">
                  {status === "locked"
                    ? "Complete and receive approval for the previous tier before submitting these requirements."
                    : status === "rejected"
                      ? "Review the rejection reason and submit the tier again."
                      : "Submitted KYC information will appear here after this tier is sent for review."}
                </p>
              </div>
            )}

            {submission?.rejectionReason ? (
              <div className="mt-6 rounded-[20px] bg-[#FFF0F0] p-4 text-sm text-[#C24141]">
                <p className="font-semibold">Reason for rejection</p>
                <p className="mt-2">{submission.rejectionReason}</p>
              </div>
            ) : null}

            {showInlineCountryCard ? (
              <div className="mt-8 rounded-[24px] border border-[#E8ECF4] bg-[#FBFDFF] p-5">
                <h3 className="text-xl font-semibold text-gray1">
                  Complete Your KYC Registration
                </h3>
                <div className="mt-4 max-w-md">
                  <SingleSelect
                    label="Country of Origin"
                    value={inlineCountry}
                    onValueChange={setInlineCountry}
                    options={[{ value: "Nigeria", label: "Nigeria" }]}
                  />
                </div>
                <div className="mt-4 max-w-[180px]">
                  <Button
                    title="Next"
                    isBusy={submitting}
                    disabled={submitting}
                    onClick={() => void handleInlineCountrySubmit()}
                  />
                </div>
              </div>
            ) : null}

            {submission?.documents?.length ? (
              isBuyerDetail ? (
                renderBuyerDocumentTable(selectedTier, submission)
              ) : (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray1">Uploaded documents</h3>
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date uploaded</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submission.documents.map((document) => (
                          <TableRow key={document.fieldName}>
                            <TableCell>{document.fileName}</TableCell>
                            <TableCell>
                              {getKycFileTypeLabel(document.fileType, document.fileName)}
                            </TableCell>
                            <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                            <TableCell>
                              <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary"
                              >
                                Download
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )
            ) : null}

            {canOpenUpgrade ? (
              <div className="mt-8 max-w-[220px]">
                <Button
                  title="Upgrade"
                  disabled={submitting}
                  onClick={() => openSubmissionDialog(selectedTier)}
                />
              </div>
            ) : null}

            {submission?.status === "rejected" ? (
              <div className="mt-6 max-w-[220px]">
                <Button
                  title="Submit again"
                  disabled={submitting}
                  onClick={() => openSubmissionDialog(selectedTier)}
                />
              </div>
            ) : null}
          </section>
        </div>
      </>
    );
  };

  if (!token) {
    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
        <div className="p-6 text-sm text-gray3">Redirecting to login...</div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="KYC Verification" description={KYC_ROLE_DESCRIPTIONS[role]} />
        <div className="p-6 text-sm text-danger">{error}</div>
      </>
    );
  }

  const feedbackIsApproved = submissionFeedback?.status === "approved";
  const feedbackTitle = feedbackIsApproved ? "Congratulations" : "Submitted for review";
  const feedbackMessage = feedbackIsApproved
    ? `You have upgraded to ${submissionFeedback?.tierLabel}`
    : `${submissionFeedback?.tierLabel} has been submitted for review.`;

  return (
    <>
      {selectedTierSlug ? renderDetail() : renderList()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={cn(
            role === UserRole.ENGINEER
              ? "left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-white p-0 duration-300 sm:max-w-[500px]"
              : "sm:max-w-xl",
          )}
          showCloseButton={false}
        >
          <DialogHeader
            className={cn(
              role === UserRole.ENGINEER
                ? "relative h-[90px] justify-center border-b border-[#EEF1F5] px-10 text-left"
                : "",
            )}
          >
            <DialogTitle
              className={cn(
                role === UserRole.ENGINEER
                  ? "max-w-[350px] text-[16px] font-medium leading-6 text-black"
                  : "",
              )}
            >
              Enter information below to upgrade KYC status.
            </DialogTitle>
            {role === UserRole.ENGINEER ? (
              <DialogClose className="absolute right-10 top-6 rounded-full p-1 text-black">
                <X size={18} />
                <span className="sr-only">Close</span>
              </DialogClose>
            ) : null}
          </DialogHeader>

          <div
            className={cn(
              role === UserRole.ENGINEER ? "space-y-5 px-10 pb-10 pt-5" : "space-y-4",
            )}
          >
            {activeTier?.requiredTextFields.map((field) =>
              field.inputType === "dropdown" ? (
                <SingleSelect
                  key={field.fieldName}
                  label={field.label}
                  value={textValues[field.fieldName] || ""}
                  onValueChange={(value) =>
                    setTextValues((current) => ({ ...current, [field.fieldName]: value }))
                  }
                  options={(field.options || []).map((option) => ({
                    label: option,
                    value: option,
                  }))}
                />
              ) : (
                <Input
                  key={field.fieldName}
                  label={field.label}
                  value={textValues[field.fieldName] || ""}
                  onChange={(event) =>
                    setTextValues((current) => ({
                      ...current,
                      [field.fieldName]: event.target.value,
                    }))
                  }
                />
              ),
            )}

            {activeTier?.requiredDocuments.map((document) => (
              <label
                key={document.fieldName}
                className={cn(
                  "block cursor-pointer text-center",
                  role === UserRole.ENGINEER
                    ? "rounded-[14px] border border-[#DDE0E5] px-5 py-4"
                    : "rounded-[24px] border border-dashed border-[#D7E6FF] p-5",
                )}
              >
                {role === UserRole.ENGINEER ? (
                  <p className="mb-3 text-left text-[13px] font-normal leading-5 text-black">
                    {document.label}
                  </p>
                ) : null}
                {role === UserRole.ENGINEER ? (
                  <FileText className="mx-auto mb-2 text-[#65758B]" size={24} />
                ) : (
                  <Upload className="mx-auto mb-3 text-primary" size={28} />
                )}
                <p
                  className={cn(
                    role === UserRole.ENGINEER
                      ? "text-[12px] font-medium leading-4 text-[#F97316]"
                      : "text-sm font-medium text-gray1",
                  )}
                >
                  Click here <span className="text-[#9CA3AF]">to upload file</span>
                </p>
                <p
                  className={cn(
                    "mt-1",
                    role === UserRole.ENGINEER
                      ? "text-[10px] leading-[14px] text-[#9CA3AF]"
                      : "text-xs text-gray3",
                  )}
                >
                  Allowed format - {KYC_UPLOAD_FORMAT_LABEL}
                </p>
                <input
                  type="file"
                  hidden
                  accept={KYC_UPLOAD_ACCEPT}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setFiles((current) => ({ ...current, [document.fieldName]: file }));
                  }}
                />
                {files[document.fieldName] ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-primary">
                    <FileText size={16} />
                    {files[document.fieldName]?.name}
                  </p>
                ) : null}
              </label>
            ))}

            {activeTier && Object.keys(textValues).length > 0 ? (
              <div
                className={cn(
                  "space-y-2 rounded-[20px] bg-[#F8FAFC] p-4 text-sm text-gray2",
                  role === UserRole.ENGINEER ? "hidden" : "",
                )}
              >
                {Object.entries(textValues).map(([fieldName, value]) => (
                  <p key={fieldName}>
                    <span className="font-medium">
                      {labelForTextField(activeTier, fieldName)}:
                    </span>{" "}
                    {value || "-"}
                  </p>
                ))}
              </div>
            ) : null}

            {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

            {role === UserRole.ENGINEER ? (
              <p className="text-[11px] leading-4 text-[#F97316]">
                Note: Document should be clear and fit the file format.
              </p>
            ) : null}

            <div className={cn(role === UserRole.ENGINEER ? "" : "flex justify-end")}>
              <Button
                title="Submit"
                isBusy={submitting}
                disabled={submitting}
                className={cn(
                  role === UserRole.ENGINEER
                    ? "h-[60px] rounded-[14px] text-[12px]"
                    : "max-w-[180px]",
                )}
                onClick={() => activeTier && void submitTier(activeTier, textValues)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(submissionFeedback)}
        onOpenChange={() => setSubmissionFeedback(null)}
      >
        <DialogContent
          className="w-[260px] rounded-[12px] border-0 p-0 shadow-lg"
          showCloseButton={false}
        >
          <div className="flex min-h-[164px] flex-col items-center justify-center px-8 py-6 text-center">
            {feedbackIsApproved ? (
              <ThumbsUp size={28} className="text-[#22C55E]" />
            ) : (
              <Clock3 size={28} className="text-[#D87C1D]" />
            )}
            <p
              className={cn(
                "mt-3 text-[14px] font-medium leading-5",
                feedbackIsApproved ? "text-[#22C55E]" : "text-[#D87C1D]",
              )}
            >
              {feedbackTitle}
            </p>
            <p className="mt-2 text-[12px] leading-4 text-black">
              {feedbackMessage}
            </p>
            <button
              type="button"
              className="mt-5 h-[34px] w-[112px] rounded-[6px] bg-[#0669D9] text-[12px] text-white"
              onClick={() => setSubmissionFeedback(null)}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
