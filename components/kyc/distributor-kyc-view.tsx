"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  ShieldCheck,
  Star,
  Upload,
  XCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  useCreateKycSubmissionMutation,
  useMyKycQuery,
  useUploadKycDocumentMutation,
} from "@/hooks/queries/kyc";
import authService from "@/services/authService";
import { setUser } from "@/store/slices/auth-slice";
import type { KycSubmission, KycTierDefinition } from "@/types/kyc";
import { UserRole } from "@/types/user";
import { KYC_UPLOAD_ACCEPT, KYC_UPLOAD_FORMAT_LABEL } from "./config";

type TierStatus = "approved" | "pending" | "rejected" | "available" | "locked";
type FileMap = Record<string, File | null>;
const DISTRIBUTOR_TIER_KEYS = new Set([
  "basic_seller",
  "registered_seller",
  "id_verified",
  "business_verified",
  "platinum_seller",
]);

interface DistributorKycViewProps {
  selectedTierSlug?: string;
}

const STATUS_STYLES: Record<TierStatus, string> = {
  approved: "border-[#BBF7D0] bg-[#16A34A] text-white",
  pending: "border-[#FDBA74] bg-[#FF7A00] text-white",
  rejected: "border-[#FECACA] bg-[#DC2626] text-white",
  available: "border-[#BFDBFE] bg-[#EFF6FF] text-primary",
  locked: "border-gray5 bg-white text-gray3",
};

const STATUS_LABELS: Record<TierStatus, string> = {
  approved: "Approved",
  pending: "Pending approval",
  rejected: "Rejected",
  available: "Upgrade",
  locked: "Locked",
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatStatusForCard = (tier: KycTierDefinition, status: TierStatus) => {
  if (status === "approved" || status === "pending" || status === "rejected") {
    return STATUS_LABELS[status];
  }

  return tier.processingTime ? `(${tier.processingTime})` : "";
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
      ? previousTier.submissionBehavior === "none" ||
        approvedTierKeys.has(previousTier.tierKey)
      : false;

    return previousTierApproved ? "available" : "locked";
  });
};

const labelForTextField = (tier: KycTierDefinition, fieldName: string) =>
  tier.requiredTextFields.find((field) => field.fieldName === fieldName)?.label ?? fieldName;

const tierAccent = (tierKey: string) => {
  switch (tierKey) {
    case "id_verified":
      return "text-[#16A34A]";
    case "business_verified":
    case "platinum_seller":
      return "text-[#F59E0B]";
    case "registered_seller":
      return "text-primary";
    default:
      return "text-gray2";
  }
};

function TierMarker({
  tier,
  status,
}: {
  tier: KycTierDefinition;
  status: TierStatus;
}) {
  if (status === "approved") {
    return <BadgeCheck className="size-4 text-primary" aria-hidden />;
  }

  if (status === "pending") {
    return <Clock3 className="size-4 text-[#FF7A00]" aria-hidden />;
  }

  if (status === "rejected") {
    return <XCircle className="size-4 text-danger" aria-hidden />;
  }

  if (tier.tierKey === "id_verified") {
    return <ShieldCheck className={`size-4 ${tierAccent(tier.tierKey)}`} aria-hidden />;
  }

  if (tier.tierKey === "platinum_seller") {
    return <Star className={`size-4 ${tierAccent(tier.tierKey)}`} aria-hidden />;
  }

  return <BadgeCheck className={`size-4 ${tierAccent(tier.tierKey)}`} aria-hidden />;
}

function StatusPill({ status }: { status: TierStatus }) {
  if (status === "locked") {
    return null;
  }

  const icon =
    status === "approved" ? (
      <Check className="size-4" />
    ) : status === "pending" ? (
      <Clock3 className="size-4" />
    ) : status === "rejected" ? (
      <XCircle className="size-4" />
    ) : null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${STATUS_STYLES[status]}`}
    >
      {icon}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-gray3">{label}</p>
      <p className="text-xl text-gray2">{value || "-"}</p>
    </div>
  );
}

export default function DistributorKycView({
  selectedTierSlug,
}: DistributorKycViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: authUser } = useAppSelector((state) => state.auth);
  const token = authUser?.tokens?.accessToken ?? "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<KycTierDefinition | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inlineCountry, setInlineCountry] = useState("Nigeria");

  const kycQuery = useMyKycQuery();
  const uploadDocument = useUploadKycDocumentMutation();
  const createSubmission = useCreateKycSubmissionMutation();

  const tiers: KycTierDefinition[] = useMemo(
    () =>
      (kycQuery.data?.tiers ?? []).filter((tier) =>
        DISTRIBUTOR_TIER_KEYS.has(tier.tierKey),
      ),
    [kycQuery.data?.tiers],
  );
  const submissions: KycSubmission[] = useMemo(
    () =>
      (kycQuery.data?.submissions ?? []).filter(
        (submission) => submission.userRole === UserRole.DISTRIBUTOR,
      ),
    [kycQuery.data?.submissions],
  );
  const loading = kycQuery.isLoading;
  const error = kycQuery.isError
    ? kycQuery.error instanceof Error
      ? kycQuery.error.message
      : "Unable to load KYC data"
    : null;

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
      // Keep the KYC screen interactive if profile refresh is temporarily unavailable.
    }
  }, [authUser, dispatch, token]);

  const hasApprovedSubmission = submissions.some(
    (submission) => submission.status === "approved",
  );

  useEffect(() => {
    if (hasApprovedSubmission) {
      void refreshAuthProfile();
    }
  }, [hasApprovedSubmission, refreshAuthProfile]);

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

  const selectedTier = useMemo(
    () => tiers.find((tier) => tier.routeSlug === selectedTierSlug) ?? null,
    [selectedTierSlug, tiers],
  );

  const currentTier = useMemo(() => {
    const ordered = tiers.filter((tier) => tierStatusMap[tier.tierKey] === "approved");

    return ordered.at(-1) ?? null;
  }, [tierStatusMap, tiers]);

  const rejectedRecoveryTier = useMemo(
    () => tiers.find((tier) => tierStatusMap[tier.tierKey] === "rejected") ?? null,
    [tierStatusMap, tiers],
  );

  const nextAvailableTier = useMemo(
    () => tiers.find((tier) => tierStatusMap[tier.tierKey] === "available") ?? null,
    [tierStatusMap, tiers],
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
  ): Promise<boolean> => {
    if (!token || submitting) {
      return false;
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

        const uploaded = await uploadDocument.mutateAsync(file);
        uploadedDocuments.push({
          fieldName: documentDefinition.fieldName,
          fileName: uploaded.data.fileName,
          fileType: uploaded.data.fileType,
          fileUrl: uploaded.data.fileUrl,
          cloudinaryId: uploaded.data.cloudinaryId,
        });
      }

      await createSubmission.mutateAsync({
        tierKey: tier.tierKey,
        textFields: payloadTextFields,
        documents: uploadedDocuments,
      });

      setDialogOpen(false);
      setActiveTier(null);
      return true;
    } catch (submitTierError) {
      setSubmitError(
        submitTierError instanceof Error
          ? submitTierError.message
          : "Unable to submit KYC information",
      );
      return false;
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

    const submitted = await submitTier(basicTier, { countryOfOrigin: inlineCountry });
    if (submitted) {
      router.push("/dashboard/distributor/kyc-verification/registered-seller");
    }
  };

  const renderDocumentTable = (
    documents: KycSubmission["documents"],
    emptyMessage: string,
  ) => {
    if (!documents.length) {
      return (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#D9E2F0] p-5 text-sm text-gray3">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="mt-6 overflow-x-auto rounded-[20px] border border-[#E8EEF6] bg-white">
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
            {documents.map((document) => (
              <TableRow key={document.fieldName}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#EAF7EE] text-[#16A34A]">
                      <FileText className="size-5" />
                    </span>
                    <span>{document.fileName}</span>
                  </div>
                </TableCell>
                <TableCell>{document.fileType}</TableCell>
                <TableCell>{formatDateTime(document.uploadedAt)}</TableCell>
                <TableCell>
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-[#D9E2F0] text-gray2 transition hover:border-primary hover:text-primary"
                  >
                    <Eye className="size-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderList = () => (
    <>
      <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
      <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
        <nav
          aria-label="KYC tier status"
          className="rounded-[24px] border border-[#E4EAF3] bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold text-gray1">Account Tiers</h2>
              <p className="mt-2 text-sm text-gray3">
                The higher your account tiers, the higher your privileges/benefit on the
                platform.
              </p>
            </div>
            {currentTier ? (
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <div className="inline-flex items-center gap-2 text-base font-medium text-gray1">
                  <span>{currentTier.tierLabel}</span>
                  <TierMarker tier={currentTier} status={tierStatusMap[currentTier.tierKey]} />
                </div>
                {rejectedRecoveryTier || nextAvailableTier ? (
                  <Link
                    href={`/dashboard/distributor/kyc-verification/${
                      (rejectedRecoveryTier ?? nextAvailableTier)?.routeSlug
                    }`}
                    className="inline-flex min-w-[108px] items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white"
                  >
                    Upgrade
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </nav>

        <section className="space-y-4">
          {tiers.map((tier) => {
            const status = tierStatusMap[tier.tierKey] ?? "locked";
            const detailHref = `/dashboard/distributor/kyc-verification/${tier.routeSlug}`;

            return (
              <article
                key={tier.tierKey}
                className="rounded-[20px] border border-[#EEF2F8] bg-white px-4 py-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-[20px] font-medium text-gray1">
                      <span>{tier.tierLabel}</span>
                      <TierMarker tier={tier} status={status} />
                    </div>
                    {tier.processingTime ? (
                      <span className="text-sm text-gray3">({tier.processingTime})</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {status === "pending" || status === "approved" || status === "rejected" ? (
                      <span className="text-sm text-gray3">{formatStatusForCard(tier, status)}</span>
                    ) : null}
                    <Link
                      href={detailHref}
                      className="inline-flex items-center gap-2 text-[18px] font-medium text-gray1"
                    >
                      <span>See details</span>
                      <ChevronRight className="size-5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </>
  );

  const renderBasicSellerDetail = (
    tier: KycTierDefinition,
    submission: KycSubmission | null,
  ) => {
    const fields = [
      { label: "First name", value: authUser?.firstName || "-" },
      { label: "Last name", value: authUser?.lastName || "-" },
      { label: "First Email address", value: authUser?.email || "-" },
      { label: "Phone number", value: authUser?.phoneNumber || "-" },
    ];
    const status = tierStatusMap[tier.tierKey] ?? "approved";

    return (
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]">
        <div className="grid gap-8 sm:grid-cols-2">
          {fields.map((field) => (
            <ReadOnlyField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>

        <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FCFDFE] p-6">
          <div className="mb-6 flex gap-3">
            <span className="h-1.5 w-9 rounded-full bg-[#FF7A00]" />
            <span className="h-1.5 w-9 rounded-full bg-[#FFD9B5]" />
          </div>
          <h3 className="text-[22px] font-semibold text-gray1">Complete Your KYC Registration</h3>
          <p className="mt-2 text-sm text-gray3">Business key information</p>

          {submission ? (
            <div className="mt-8 space-y-5">
              <ReadOnlyField
                label="Country of Origin"
                value={submission.textFields.countryOfOrigin || inlineCountry}
              />
              <StatusPill status={status} />
            </div>
          ) : (
            <>
              <div className="mt-10">
                <SingleSelect
                  label="Country of Origin"
                  value={inlineCountry}
                  onValueChange={setInlineCountry}
                  options={[{ value: "Nigeria", label: "Nigeria" }]}
                  placeholder="Select Country of Origin"
                />
              </div>
              <div className="mt-20">
                <Button
                  title="Next"
                  isBusy={submitting}
                  disabled={submitting}
                  iconRight={<ChevronRight className="size-5" />}
                  className="rounded-2xl"
                  onClick={() => void handleInlineCountrySubmit()}
                />
              </div>
              {submitError ? <p className="mt-4 text-sm text-danger">{submitError}</p> : null}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderRegisteredSellerDetail = (
    tier: KycTierDefinition,
    submission: KycSubmission | null,
  ) => {
    const status = tierStatusMap[tier.tierKey] ?? "locked";
    const fieldEntries = tier.requiredTextFields.map((field) => ({
      label: field.label,
      value: submission?.textFields[field.fieldName] || "-",
    }));

    return (
      <>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {fieldEntries.map((field) => (
            <ReadOnlyField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          {status === "available" ? (
            <Button
              title="Upgrade"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
          {submission?.status === "rejected" ? (
            <Button
              title="Submit again"
              variant="primaryLight"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
        </div>
      </>
    );
  };

  const renderDocumentHeavyTier = (
    tier: KycTierDefinition,
    submission: KycSubmission | null,
  ) => {
    const status = tierStatusMap[tier.tierKey] ?? "locked";
    const passportPhoto =
      submission?.documents.find((document) => document.fieldName === "passportPhoto")?.fileUrl ||
      authUser?.displayPhoto?.url ||
      "";

    return (
      <>
        <div className="mt-8 grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[20px] border border-[#E8EEF6] bg-[#F8FAFD]">
            {passportPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={passportPhoto}
                alt="Distributor verification"
                className="h-full min-h-[220px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center text-sm text-gray3">
                No image uploaded yet.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-[#E8EEF6] p-5">
            <h3 className="text-[18px] font-semibold text-gray1">Uploaded documents</h3>
            {renderDocumentTable(
              submission?.documents ?? [],
              "Uploaded documents will appear here after you submit this tier.",
            )}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          {status === "available" ? (
            <Button
              title="Upgrade"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
          {submission?.status === "rejected" ? (
            <Button
              title="Submit again"
              variant="primaryLight"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
        </div>
      </>
    );
  };

  const renderGenericTierDetail = (
    tier: KycTierDefinition,
    submission: KycSubmission | null,
  ) => {
    const status = tierStatusMap[tier.tierKey] ?? "locked";
    const fieldEntries = tier.requiredTextFields.map((field) => ({
      label: field.label,
      value: submission?.textFields[field.fieldName] || "-",
    }));

    return (
      <>
        {fieldEntries.length ? (
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {fieldEntries.map((field) => (
              <ReadOnlyField key={field.label} label={field.label} value={field.value} />
            ))}
          </div>
        ) : null}

        {tier.requiredDocuments.length ? (
          <div className="mt-8 rounded-[24px] border border-[#E8EEF6] p-5">
            <h3 className="text-[18px] font-semibold text-gray1">Uploaded documents</h3>
            {renderDocumentTable(
              submission?.documents ?? [],
              "Uploaded documents will appear here after you submit this tier.",
            )}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          {status === "available" ? (
            <Button
              title="Upgrade"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
          {submission?.status === "rejected" ? (
            <Button
              title="Submit again"
              variant="primaryLight"
              className="max-w-[180px] rounded-2xl"
              disabled={submitting}
              onClick={() => openSubmissionDialog(tier)}
            />
          ) : null}
        </div>
      </>
    );
  };

  const renderDetail = () => {
    if (!selectedTier) {
      return (
        <>
          <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
          <div className="p-6 text-sm text-danger">KYC tier not found.</div>
        </>
      );
    }

    const submission = getLatestSubmission(submissions, selectedTier.tierKey);
    const status = tierStatusMap[selectedTier.tierKey] ?? "locked";

    return (
      <>
        <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
        <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
          <Link
            href="/dashboard/distributor/kyc-verification"
            className="inline-flex items-center gap-2 text-[18px] text-gray2"
          >
            <ArrowLeft className="size-5" />
            Go Back
          </Link>

          <section className="rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold text-gray1">{selectedTier.detailTitle}</h2>
                <p className="mt-2 text-sm text-gray3">{selectedTier.detailSubtitle}</p>
              </div>
              {submission || selectedTier.tierKey !== "basic_seller" ? (
                <StatusPill status={status} />
              ) : null}
            </div>

            {submission?.rejectionReason ? (
              <div className="mt-6 rounded-[20px] border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-danger">
                <p className="font-semibold">Reason for rejection</p>
                <p className="mt-2">{submission.rejectionReason}</p>
              </div>
            ) : null}

            {selectedTier.tierKey === "basic_seller"
              ? renderBasicSellerDetail(selectedTier, submission)
              : selectedTier.tierKey === "registered_seller"
                ? renderRegisteredSellerDetail(selectedTier, submission)
                : selectedTier.tierKey === "id_verified"
                  ? renderDocumentHeavyTier(selectedTier, submission)
                  : renderGenericTierDetail(selectedTier, submission)}
          </section>
        </div>
      </>
    );
  };

  if (!token) {
    return (
      <>
        <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
        <div className="p-6 text-sm text-gray3">Redirecting to login...</div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="KYC Verification" description="Verify and upgrade your kyc status." />
        <div className="p-6 text-sm text-danger">{error}</div>
      </>
    );
  }

  return (
    <>
      {selectedTierSlug ? renderDetail() : renderList()}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[500px] rounded-[28px] p-0">
          <DialogHeader className="border-b border-[#EAEFF5] px-8 py-6">
            <DialogTitle className="pr-8 text-[20px] font-semibold leading-9 text-gray1">
              Enter information below to upgrade KYC status.
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-8 py-7">
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
                  placeholder={`Enter ${field.label.toLowerCase()}`}
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
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ),
            )}

            {activeTier?.requiredDocuments.map((document) => (
              <label key={document.fieldName} className="block space-y-3">
                <span className="text-[18px] text-gray1">{document.label}</span>
                <span className="block cursor-pointer rounded-[20px] border border-[#D9E2F0] px-6 py-8 text-center">
                  <Upload className="mx-auto mb-3 size-8 text-gray3" />
                  <span className="block text-[18px] text-gray3">
                    <span className="text-[#FF7A00]">Click here</span> to upload file
                  </span>
                  <span className="mt-2 block text-sm text-gray4">
                    Allowed format - {KYC_UPLOAD_FORMAT_LABEL}
                  </span>
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
                    <span className="mt-3 inline-flex items-center gap-2 text-sm text-primary">
                      <FileText className="size-4" />
                      {files[document.fieldName]?.name}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}

            {activeTier?.requiredDocuments.length || activeTier?.requiredTextFields.length ? (
              <p className="text-sm text-[#FF7A00]">
                Note: Document should be clear and fit file format.
              </p>
            ) : null}

            {activeTier && Object.keys(textValues).length > 0 ? (
              <div className="space-y-2 rounded-[20px] bg-[#F8FAFC] p-4 text-sm text-gray2">
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

            <Button
              title="Submit"
              isBusy={submitting}
              disabled={submitting}
              className="rounded-2xl"
              onClick={() => activeTier && void submitTier(activeTier, textValues)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
