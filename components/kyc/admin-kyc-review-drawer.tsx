"use client";

/**
 * Admin review drawer for a single KYC submission.
 *
 * Which actions are legal is decided by the server, not by this UI — see
 * `service.ts`. Mirrored here so the admin never fires a call that 400s:
 *
 *   - approve / reject : only `submitted` or `under_review`, and only on
 *                        `review_required` tiers
 *   - mark under review: only `submitted` (not `under_review` — it is not
 *                        idempotent and will error on a second click)
 *   - reject           : reason required, non-empty after trim
 *
 * Terminal states (`approved`, `rejected`) are read-only; the server rejects
 * any further transition.
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Eye, FileText } from "lucide-react";

import { Button, Drawer, Spinner, Textarea } from "@/components/base";
import { ALL_KYC_TIERS } from "@/constants/kycTiers";
import {
  useAdminKycDetailQuery,
  useApproveKycMutation,
  useMarkKycUnderReviewMutation,
  useRejectKycMutation,
} from "@/hooks/queries/kyc";
import { cn } from "@/lib/utils";
import { getKycFileTypeLabel } from "@/utils/kycFileTypeLabel";

const humanizeFieldName = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-[#FFF4E5] text-[#E26B0A]",
  "Under review": "bg-[#EAF2FE] text-[#0669D9]",
  Approved: "bg-[#E7F7EC] text-[#13A83B]",
  Rejected: "bg-[#FDECEC] text-[#D92D20]",
  Draft: "bg-[#F3F4F6] text-[#4B5563]",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export default function AdminKycReviewDrawer({
  submissionId,
  open,
  onClose,
}: {
  submissionId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useAdminKycDetailQuery(submissionId, {
    enabled: open && Boolean(submissionId),
  });
  const approve = useApproveKycMutation();
  const reject = useRejectKycMutation();
  const markUnderReview = useMarkKycUnderReviewMutation();

  const submission = detailQuery.data ?? null;
  const busy =
    approve.isPending || reject.isPending || markUnderReview.isPending;

  // Per-submission UI state (draft reason, open reject form) is reset by the
  // parent remounting this component on `key={submissionId}` — no effect needed.

  const tierDefinition = submission
    ? (ALL_KYC_TIERS.find((tier) => tier.tierKey === submission.tierKey) ?? null)
    : null;

  const isActionable =
    submission?.status === "submitted" || submission?.status === "under_review";
  // `markSubmissionUnderReview` only accepts `submitted` — never `under_review`.
  const canMarkUnderReview = submission?.status === "submitted";

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setActionError(null);

    try {
      await action();
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The action could not be completed",
      );
    }
  };

  const handleReject = () => {
    if (!submission) return;

    const reason = rejectionReason.trim();
    if (!reason) {
      setActionError("A rejection reason is required.");
      return;
    }

    void run(() =>
      reject.mutateAsync({
        tierKey: submission.tierKey,
        submissionId: submission._id,
        rejectionReason: reason,
      }),
    );
  };

  return (
    <Drawer
      title="KYC submission"
      open={open}
      onClose={() => {
        if (busy) return; // don't abandon an in-flight decision
        onClose();
      }}
      contentClassName="w-full sm:max-w-[520px]"
    >
      {detailQuery.isLoading ? (
        <div className="space-y-3 p-1">
          <div className="h-16 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          <div className="h-24 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
          <div className="h-32 animate-pulse rounded-[8px] bg-[#F3F4F6]" />
        </div>
      ) : detailQuery.isError ? (
        <div className="flex items-start gap-2 rounded-[8px] border border-[#FDA29B] bg-[#FFFBFA] p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#D92D20]" />
          <p className="text-[13px] leading-5 text-[#B42318]">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Unable to load this submission."}
          </p>
        </div>
      ) : !submission ? (
        <p className="text-[13px] text-[#6B7280]">Submission not found.</p>
      ) : (
        <div className="space-y-5">
          {/* Applicant */}
          <section>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium leading-6 text-black">
                  {submission.user
                    ? `${submission.user.firstName} ${submission.user.lastName}`.trim() ||
                      "Unnamed user"
                    : "Unknown user"}
                </p>
                <p className="truncate text-[12px] leading-4 text-[#6B7280]">
                  {submission.user?.email ?? "-"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium leading-4",
                  STATUS_STYLES[submission.requestStatusLabel] ??
                    "bg-[#F3F4F6] text-[#4B5563]",
                )}
              >
                {submission.requestStatusLabel}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#EEF0F3] pt-4">
              <div>
                <dt className="text-[11px] leading-4 text-[#9CA3AF]">Tier</dt>
                <dd className="mt-0.5 text-[13px] leading-5 text-black">
                  {submission.tierLabel}
                  {tierDefinition ? (
                    <span className="text-[#6B7280]"> (T{tierDefinition.tierOrdinal})</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] leading-4 text-[#9CA3AF]">Account type</dt>
                <dd className="mt-0.5 text-[13px] leading-5 text-black">
                  {submission.user?.role ?? submission.userRole}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] leading-4 text-[#9CA3AF]">Submitted</dt>
                <dd className="mt-0.5 text-[13px] leading-5 text-black">
                  {formatDate(submission.submittedAt ?? submission.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] leading-4 text-[#9CA3AF]">Reviewed</dt>
                <dd className="mt-0.5 text-[13px] leading-5 text-black">
                  {formatDate(submission.reviewedAt)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Outcome of a completed review */}
          {submission.status === "rejected" && submission.rejectionReason ? (
            <div className="rounded-[8px] border border-[#FDA29B] bg-[#FFFBFA] p-3">
              <p className="text-[12px] font-medium leading-4 text-[#B42318]">
                Rejected
                {submission.reviewer
                  ? ` by ${submission.reviewer.firstName} ${submission.reviewer.lastName}`.trimEnd()
                  : ""}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
                {submission.rejectionReason}
              </p>
            </div>
          ) : null}

          {submission.status === "approved" ? (
            <div className="flex items-center gap-2 rounded-[8px] bg-[#E7F7EC] p-3 text-[13px] leading-5 text-[#0F7A2E]">
              <CheckCircle2 size={15} className="shrink-0" />
              Approved
              {submission.reviewer
                ? ` by ${submission.reviewer.firstName} ${submission.reviewer.lastName}`.trimEnd()
                : ""}
            </div>
          ) : null}

          {/* Submitted values */}
          {Object.keys(submission.textFields ?? {}).length ? (
            <section>
              <h4 className="mb-2 text-[13px] font-medium leading-5 text-black">
                Submitted information
              </h4>
              <dl className="grid grid-cols-1 gap-2 rounded-[8px] bg-[#FAFBFC] p-3 sm:grid-cols-2">
                {Object.entries(submission.textFields).map(([field, value]) => (
                  <div key={field}>
                    <dt className="text-[11px] leading-4 text-[#9CA3AF]">
                      {humanizeFieldName(field)}
                    </dt>
                    <dd className="mt-0.5 break-words text-[13px] leading-5 text-black">
                      {value || "-"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {/* Documents */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[13px] font-medium leading-5 text-black">
                Documents
              </h4>
              {tierDefinition ? (
                <span className="text-[11px] leading-4 text-[#6B7280]">
                  {submission.documents.length}/{tierDefinition.requiredDocuments.length}{" "}
                  required
                </span>
              ) : null}
            </div>

            {submission.documents.length ? (
              <ul className="space-y-2">
                {submission.documents.map((document) => (
                  <li
                    key={`${document.fieldName}-${document.fileUrl}`}
                    className="flex items-center gap-3 rounded-[8px] border border-[#EEF0F3] p-2.5"
                  >
                    <FileText size={16} className="shrink-0 text-[#6B7280]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] leading-5 text-black">
                        {tierDefinition?.requiredDocuments.find(
                          (definition) => definition.fieldName === document.fieldName,
                        )?.label ?? humanizeFieldName(document.fieldName)}
                      </p>
                      <p className="truncate text-[11px] leading-4 text-[#6B7280]">
                        {getKycFileTypeLabel(document.fileType, document.fileName)} ·{" "}
                        {document.fileName}
                      </p>
                    </div>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${document.fileName}`}
                      className="shrink-0 text-[#6B7280] hover:text-[#0669D9]"
                    >
                      <Eye size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[8px] border border-dashed border-[#DDE0E5] p-4 text-center text-[12px] leading-4 text-[#6B7280]">
                No documents on this submission.
                {tierDefinition?.requiredDocuments.length
                  ? " This tier requires them — check before approving."
                  : " This tier requires none."}
              </p>
            )}
          </section>

          {actionError ? (
            <p className="flex items-start gap-1.5 rounded-[6px] bg-[#FFFBFA] p-2 text-[12px] leading-4 text-[#B42318]">
              <AlertCircle size={13} className="mt-px shrink-0" />
              {actionError}
            </p>
          ) : null}

          {/* Actions — only on non-terminal submissions */}
          {isActionable ? (
            showRejectForm ? (
              <section className="space-y-2 border-t border-[#EEF0F3] pt-4">
                <p className="text-[11px] leading-4 text-[#6B7280]">
                  Shown to the user verbatim — be specific about what to fix.
                </p>
                <Textarea
                  id="kyc-rejection-reason"
                  label="Reason for rejection"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="e.g. The CAC status report is expired. Please upload one issued within the last 3 months."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setActionError(null);
                    }}
                    disabled={busy}
                    className="h-[40px] flex-1 rounded-[8px] border border-[#DDE0E5] bg-white text-[13px] text-[#4B5563]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={busy || !rejectionReason.trim()}
                    className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#D92D20] text-[13px] text-white disabled:opacity-60"
                  >
                    {reject.isPending ? <Spinner /> : null}
                    Confirm rejection
                  </Button>
                </div>
              </section>
            ) : (
              <section className="flex flex-wrap gap-2 border-t border-[#EEF0F3] pt-4">
                {canMarkUnderReview ? (
                  <Button
                    onClick={() =>
                      void run(() => markUnderReview.mutateAsync(submission._id))
                    }
                    disabled={busy}
                    className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#DDE0E5] bg-white text-[13px] text-[#4B5563] disabled:opacity-60"
                  >
                    {markUnderReview.isPending ? <Spinner /> : <Clock3 size={14} />}
                    Mark under review
                  </Button>
                ) : null}
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={busy}
                  className="h-[40px] flex-1 rounded-[8px] border border-[#FDA29B] bg-white text-[13px] text-[#D92D20] disabled:opacity-60"
                >
                  Reject
                </Button>
                <Button
                  onClick={() =>
                    void run(() =>
                      approve.mutateAsync({
                        tierKey: submission.tierKey,
                        submissionId: submission._id,
                      }),
                    )
                  }
                  disabled={busy}
                  className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#13A83B] text-[13px] text-white disabled:opacity-60"
                >
                  {approve.isPending ? <Spinner /> : <CheckCircle2 size={14} />}
                  Approve
                </Button>
              </section>
            )
          ) : (
            <p className="border-t border-[#EEF0F3] pt-4 text-[12px] leading-4 text-[#6B7280]">
              This submission has been reviewed and can no longer be changed.
              {submission.status === "rejected"
                ? " The user can submit again for this tier."
                : ""}
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}
