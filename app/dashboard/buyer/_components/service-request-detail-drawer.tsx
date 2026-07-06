"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileText, SquareCheck, Upload } from "lucide-react";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/base";
import {
  useAddServiceDisputeCommentMutation,
  useAddServiceDisputeEvidenceMutation,
  useCreateServiceDisputeMutation,
  useServiceDisputeQuery,
} from "@/hooks/queries/service-disputes";
import { useQueryClient } from "@tanstack/react-query";

import { useBuyerMarkCompletedMutation } from "@/hooks/queries/service-requests";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import {
  ServiceDisputeData,
  ServiceDisputeStatus,
} from "@/types/service-dispute";
import {
  ServiceRequestData,
  ServiceRequestStatus,
} from "@/types/service-request";

function getPartyName(party: ServiceRequestData["engineer"]): string {
  if (party && typeof party === "object") {
    const fullName = [party.firstName, party.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if ("email" in party && party.email) {
      return party.email;
    }
  }

  return "--";
}

function getPartyPhone(party: ServiceRequestData["engineer"]): string {
  if (party && typeof party === "object" && "phoneNumber" in party) {
    return party.phoneNumber || "--";
  }

  return "--";
}

function getPartyLabel(
  party: string | { firstName?: string; lastName?: string; email?: string } | undefined,
): string {
  if (!party || typeof party === "string") {
    return "--";
  }

  const fullName = [party.firstName, party.lastName].filter(Boolean).join(" ").trim();
  return fullName || party.email || "--";
}

function formatCurrency(value?: number): string {
  if (typeof value !== "number") {
    return "--";
  }

  return `NGN ${value.toLocaleString("en-NG")}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

function statusConfig(status: ServiceRequestStatus): {
  label: string;
  badgeBg: string;
  containerBg: string;
  containerBorder: string;
} {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return {
        label: "Pending",
        badgeBg: "bg-[#D97627]",
        containerBg: "bg-[#FFF9F0]",
        containerBorder: "border-[#D97627]",
      };
    case ServiceRequestStatus.ACCEPTED:
      return {
        label: "Accepted",
        badgeBg: "bg-[#1E9E4A]",
        containerBg: "bg-[#F0FFF5]",
        containerBorder: "border-[#1E9E4A]",
      };
    case ServiceRequestStatus.IN_PROGRESS:
      return {
        label: "In progress",
        badgeBg: "bg-[#FE6E00]",
        containerBg: "bg-[#FFF7F0]",
        containerBorder: "border-[#EF7212]",
      };
    case ServiceRequestStatus.COMPLETED:
      return {
        label: "Completed",
        badgeBg: "bg-[#34A853]",
        containerBg: "bg-[#F0FFF5]",
        containerBorder: "border-[#34A853]",
      };
    case ServiceRequestStatus.REJECTED:
      return {
        label: "Rejected",
        badgeBg: "bg-[#B91C1C]",
        containerBg: "bg-[#FFF5F5]",
        containerBorder: "border-[#B91C1C]",
      };
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return {
        label: "Closed after dispute",
        badgeBg: "bg-[#B45309]",
        containerBg: "bg-[#FFFBF0]",
        containerBorder: "border-[#B45309]",
      };
    default:
      return {
        label: status,
        badgeBg: "bg-[#6B7280]",
        containerBg: "bg-white",
        containerBorder: "border-[#E6ECF2]",
      };
  }
}

function disputeStatusLabel(status: ServiceDisputeStatus): string {
  switch (status) {
    case ServiceDisputeStatus.UNDER_REVIEW:
      return "Under review";
    case ServiceDisputeStatus.AWAITING_EVIDENCE:
      return "Awaiting evidence";
    case ServiceDisputeStatus.RESOLVED:
      return "Resolved";
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  const config = statusConfig(status);

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-8 py-5 ${config.containerBg} ${config.containerBorder}`}
    >
      <span className="text-sm font-medium text-[#272B36]">Request Status</span>
      <span
        className={`inline-flex items-center gap-2 rounded-lg px-[18px] py-[11px] text-sm font-normal text-white ${config.badgeBg}`}
      >
        <SquareCheck className="size-[18px] shrink-0" />
        {config.label}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="py-2">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-[#111827]">
        {value || "--"}
      </div>
    </div>
  );
}

function AttachmentList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; fileName: string; url: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F9FAFB] p-4">
      <p className="text-xs font-medium text-[#6B7280]">{title}</p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B7280]">No files uploaded yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm text-[#111827]">
                <FileText className="size-4 text-[#2F80ED]" />
                <span>{item.fileName}</span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-primary"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ServiceRequestDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  request: ServiceRequestData;
}

export default function ServiceRequestDetailDrawer({
  open,
  onClose,
  request,
}: ServiceRequestDetailDrawerProps) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const markCompletedMutation = useBuyerMarkCompletedMutation();

  const [markingCompleted, setMarkingCompleted] = useState(false);
  const [drawerError, setDrawerError] = useState("");

  const [dispute, setDispute] = useState<ServiceDisputeData | null>(null);
  const [disputeError, setDisputeError] = useState("");

  const [isRaiseDisputeOpen, setIsRaiseDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeFile, setDisputeFile] = useState<File | null>(null);

  const [commentDraft, setCommentDraft] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const createDisputeMutation = useCreateServiceDisputeMutation();
  const addCommentMutation = useAddServiceDisputeCommentMutation();
  const addEvidenceMutation = useAddServiceDisputeEvidenceMutation();

  const creatingDispute = createDisputeMutation.isPending;
  const commentBusy = addCommentMutation.isPending;
  const evidenceBusy = addEvidenceMutation.isPending;

  const isInProgress = request.status === ServiceRequestStatus.IN_PROGRESS;
  const isCompleted = request.status === ServiceRequestStatus.COMPLETED;
  const isClosedAfterDispute =
    request.status === ServiceRequestStatus.CLOSED_AFTER_DISPUTE;

  const detailRows = useMemo(
    () => [
      { label: "Name of engineer", value: getPartyName(request.engineer) },
      { label: "Phone number", value: getPartyPhone(request.engineer) },
      { label: "Service type", value: request.jobType },
      { label: "Price", value: formatCurrency(request.price) },
      { label: "Product name", value: request.equipmentName },
      { label: "Model", value: request.model || request.brand || "--" },
      { label: "Unit price", value: formatCurrency(request.unitPrice) },
      { label: "Date of request", value: formatDate(request.createdAt) },
      {
        label: isCompleted || isClosedAfterDispute ? "Additional note" : "Description",
        value: request.serviceDescription || "--",
      },
    ],
    [
      isClosedAfterDispute,
      isCompleted,
      request.brand,
      request.createdAt,
      request.engineer,
      request.equipmentName,
      request.jobType,
      request.model,
      request.price,
      request.serviceDescription,
      request.unitPrice,
    ],
  );

  const activeDisputeQuery = useServiceDisputeQuery(
    request.activeDisputeId,
    false,
    { enabled: open && Boolean(request.activeDisputeId) },
  );
  const disputeLoading = activeDisputeQuery.isPending && open && Boolean(request.activeDisputeId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDrawerError("");

    if (!request.activeDisputeId) {
      setDispute(null);
      setDisputeError("");
      return;
    }

    if (activeDisputeQuery.data) {
      setDispute(activeDisputeQuery.data);
      setDisputeError("");
    } else if (activeDisputeQuery.isError) {
      setDisputeError(
        activeDisputeQuery.error instanceof Error
          ? activeDisputeQuery.error.message
          : "Failed to load the active dispute.",
      );
    }
  }, [
    open,
    request.activeDisputeId,
    activeDisputeQuery.data,
    activeDisputeQuery.isError,
    activeDisputeQuery.error,
  ]);

  const refreshRequests = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.serviceRequests.all,
    });
  };

  const handleMarkCompleted = async () => {
    if (!token) {
      setDrawerError("Session expired. Please log in again.");
      return;
    }

    setDrawerError("");
    setMarkingCompleted(true);

    try {
      await markCompletedMutation.mutateAsync(request._id);
      onClose();
    } catch (error) {
      setDrawerError(
        error instanceof Error
          ? error.message
          : "Failed to mark this request as completed. Try again.",
      );
    } finally {
      setMarkingCompleted(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!token) {
      setDrawerError("Session expired. Please log in again.");
      return;
    }

    if (!disputeReason.trim() || !disputeDescription.trim()) {
      setDrawerError("Reason and description are required to raise a dispute.");
      return;
    }

    setDrawerError("");

    try {
      const payload =
        disputeFile != null
          ? (() => {
              const formData = new FormData();
              formData.append("reason", disputeReason.trim());
              formData.append("description", disputeDescription.trim());
              formData.append("file", disputeFile);
              return formData;
            })()
          : {
              reason: disputeReason.trim(),
              description: disputeDescription.trim(),
            };

      const result = await createDisputeMutation.mutateAsync({
        serviceRequestId: request._id,
        payload,
      });

      setDispute(result.data.dispute);
      setIsRaiseDisputeOpen(false);
      setDisputeReason("");
      setDisputeDescription("");
      setDisputeFile(null);
      await refreshRequests();
    } catch (error) {
      setDrawerError(
        error instanceof Error
          ? error.message
          : "Failed to create the dispute. Try again.",
      );
    }
  };

  const handleAddComment = async () => {
    if (!token || !dispute?._id) {
      setDrawerError("Active dispute context is unavailable.");
      return;
    }

    if (!commentDraft.trim()) {
      return;
    }

    setDrawerError("");

    try {
      const updatedDispute = await addCommentMutation.mutateAsync({
        disputeId: dispute._id,
        text: commentDraft.trim(),
      });

      setDispute(updatedDispute);
      setCommentDraft("");
    } catch (error) {
      setDrawerError(
        error instanceof Error
          ? error.message
          : "Failed to add the dispute comment.",
      );
    }
  };

  const handleAddEvidence = async () => {
    if (!token || !dispute?._id) {
      setDrawerError("Active dispute context is unavailable.");
      return;
    }

    if (!evidenceFile) {
      setDrawerError("Choose a file before uploading evidence.");
      return;
    }

    setDrawerError("");

    try {
      const updatedDispute = await addEvidenceMutation.mutateAsync({
        disputeId: dispute._id,
        file: evidenceFile,
      });

      setDispute(updatedDispute);
      setEvidenceFile(null);
    } catch (error) {
      setDrawerError(
        error instanceof Error
          ? error.message
          : "Failed to upload dispute evidence.",
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[500px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-[#111827]">
              Request For Service Engineer
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <StatusBadge status={request.status} />

            <div className="divide-y divide-[#F3F4F6]">
              {detailRows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>

            {(isCompleted || isClosedAfterDispute) && (
              <AttachmentList
                title="Proof of completion"
                items={
                  request.proofOfCompletion
                    ? [
                        {
                          id: request.proofOfCompletion.cloudinary_id,
                          fileName: request.proofOfCompletion.fileName,
                          url: request.proofOfCompletion.url,
                        },
                      ]
                    : []
                }
              />
            )}

            {request.disputeActive ? (
              <div className="rounded-2xl border border-[#F4D7A1] bg-[#FFF8E7] px-4 py-3 text-sm text-[#8A5A18]">
                <p className="font-semibold">
                  {request.activeDisputeStatus === ServiceDisputeStatus.AWAITING_EVIDENCE
                    ? "Awaiting evidence"
                    : request.activeDisputeStatus === ServiceDisputeStatus.RESOLVED
                      ? "Resolved"
                      : "Under review"}
                </p>
                <p className="mt-1">
                  This request is currently in the dispute workflow.
                </p>
              </div>
            ) : null}

            {disputeLoading ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 text-sm text-[#6B7280]">
                Loading dispute activity...
              </div>
            ) : null}

            {disputeError ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {disputeError}
              </div>
            ) : null}

            {dispute ? (
              <div className="space-y-4 rounded-2xl border border-[#E6ECF2] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#6B7280]">Dispute status</p>
                    <p className="text-sm font-semibold text-[#111827]">
                      {disputeStatusLabel(dispute.status)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Raised by</p>
                    <p className="text-sm font-medium text-[#111827]">
                      {getPartyLabel(dispute.buyer)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <DetailRow label="Reason" value={dispute.reason} />
                  <DetailRow label="Description" value={dispute.description} />
                </div>

                <AttachmentList
                  title="Evidence added"
                  items={dispute.evidence.map((item) => ({
                    id: item.cloudinary_id,
                    fileName: item.fileName,
                    url: item.url,
                  }))}
                />

                <div className="rounded-2xl border border-[#E6ECF2] bg-[#F9FAFB] p-4">
                  <p className="text-xs font-medium text-[#6B7280]">
                    Previous notes on dispute ({dispute.comments.length})
                  </p>

                  {dispute.comments.length === 0 ? (
                    <p className="mt-2 text-sm text-[#6B7280]">
                      No notes have been added yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {dispute.comments.map((comment, index) => (
                        <div
                          key={`${comment.createdAt}-${index}`}
                          className="rounded-xl bg-white px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#111827]">
                              {getPartyLabel(comment.author)}
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-[#4B5563]">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {dispute.status !== ServiceDisputeStatus.RESOLVED ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="buyer-dispute-comment"
                        className="text-xs font-medium text-[#6B7280]"
                      >
                        Add comment (optional)
                      </label>
                      <textarea
                        id="buyer-dispute-comment"
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Enter your note here..."
                        className="mt-2 min-h-[96px] w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        disabled={commentBusy || commentDraft.trim().length === 0}
                        isBusy={commentBusy}
                        onClick={() => void handleAddComment()}
                        className="w-full"
                      >
                        Add comment
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-dashed border-[#D5DEE8] p-4">
                      <label
                        htmlFor="buyer-dispute-evidence"
                        className="text-xs font-medium text-[#6B7280]"
                      >
                        Upload more evidence
                      </label>
                      <input
                        id="buyer-dispute-evidence"
                        type="file"
                        onChange={(event) =>
                          setEvidenceFile(event.target.files?.[0] ?? null)
                        }
                        className="mt-2 block w-full text-sm text-[#6B7280]"
                      />
                      <Button
                        type="button"
                        disabled={evidenceBusy || !evidenceFile}
                        isBusy={evidenceBusy}
                        onClick={() => void handleAddEvidence()}
                        className="mt-3 w-full bg-white! text-primary! border-primary!"
                        iconLeft={<Upload className="size-4" />}
                      >
                        Upload evidence
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {drawerError ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {drawerError}
              </div>
            ) : null}

            {isInProgress && !request.disputeActive ? (
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  isBusy={markingCompleted}
                  disabled={markingCompleted}
                  onClick={() => void handleMarkCompleted()}
                  iconLeft={<CheckCircle2 className="size-4" />}
                  className="w-full bg-[#FF7A2E]! text-white! hover:bg-[#F06E25]!"
                >
                  Mark as completed
                </Button>

                <button
                  type="button"
                  onClick={() => setIsRaiseDisputeOpen(true)}
                  className="w-full rounded-xl border border-[#F4B183] py-3 text-sm font-semibold text-[#F08A32] transition-colors hover:bg-orange-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Raise dispute
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRaiseDisputeOpen} onOpenChange={setIsRaiseDisputeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#111827]">
              Flag dispute
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="service-dispute-reason"
                className="text-xs font-medium text-[#6B7280]"
              >
                Reason
              </label>
              <input
                id="service-dispute-reason"
                type="text"
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                placeholder="Enter dispute reason"
                className="mt-2 h-11 w-full rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            <div>
              <label
                htmlFor="service-dispute-description"
                className="text-xs font-medium text-[#6B7280]"
              >
                Description
              </label>
              <textarea
                id="service-dispute-description"
                value={disputeDescription}
                onChange={(event) => setDisputeDescription(event.target.value)}
                placeholder="Describe what happened"
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            <div className="rounded-2xl border border-dashed border-[#D5DEE8] p-4">
              <label
                htmlFor="service-dispute-file"
                className="text-xs font-medium text-[#6B7280]"
              >
                Upload evidence (optional)
              </label>
              <input
                id="service-dispute-file"
                type="file"
                onChange={(event) => setDisputeFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-[#6B7280]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                isBusy={creatingDispute}
                disabled={creatingDispute}
                onClick={() => void handleCreateDispute()}
                className="w-full"
              >
                Submit dispute
              </Button>
              <Button
                type="button"
                variant="primaryLight"
                disabled={creatingDispute}
                onClick={() => setIsRaiseDisputeOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
