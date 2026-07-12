"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Send,
  SquareCheck,
  Upload,
  XCircle,
} from "lucide-react";

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

function getPartyLabel(
  party: string | { firstName?: string; lastName?: string; email?: string } | undefined,
): string {
  if (!party || typeof party === "string") {
    return "--";
  }

  const fullName = [party.firstName, party.lastName].filter(Boolean).join(" ").trim();
  return fullName || party.email || "--";
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

/** e.g. "Feb 1, 2026 10:45 PM" */
function formatDateTime(value?: string): string {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

type StatusVisual = {
  label: string;
  /** Badge pill text + icon color */
  badgeText: string;
  /** Badge pill background */
  badgePill: string;
  /** Outer container background */
  containerBg: string;
  /** Outer container border */
  containerBorder: string;
  /** Icon shown inside the badge pill */
  icon: ReactNode;
};

function statusConfig(status: ServiceRequestStatus): StatusVisual {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return {
        label: "Pending...",
        badgeText: "text-[#D97627]",
        badgePill: "bg-[#FBE4CE]",
        containerBg: "bg-[#FFF8F3]",
        containerBorder: "border-[#FFD5BE]",
        icon: null,
      };
    case ServiceRequestStatus.ACCEPTED:
      return {
        label: "Accepted",
        badgeText: "text-[#0AA642]",
        badgePill: "bg-[#E3F8EB]",
        containerBg: "bg-[#F5FFF8]",
        containerBorder: "border-[#92DDAA]",
        icon: <SquareCheck className="size-[18px] shrink-0 fill-[#0AA642] text-white" />,
      };
    case ServiceRequestStatus.IN_PROGRESS:
      return {
        label: "In progress",
        badgeText: "text-white",
        badgePill: "bg-[#FE6E00]",
        containerBg: "bg-[#FFF7F0]",
        containerBorder: "border-[#F6DEC7]",
        icon: <Clock className="size-[18px] shrink-0" />,
      };
    case ServiceRequestStatus.COMPLETED:
      return {
        label: "Completed",
        badgeText: "text-white",
        badgePill: "bg-[#34A853]",
        containerBg: "bg-[#F0FFF5]",
        containerBorder: "border-[#CDEBD8]",
        icon: <CheckCircle2 className="size-[18px] shrink-0" />,
      };
    case ServiceRequestStatus.REJECTED:
      return {
        label: "Rejected",
        badgeText: "text-[#FF4B30]",
        badgePill: "bg-[#FFD7D1]",
        containerBg: "bg-[#FFE7E3]",
        containerBorder: "border-[#FF705B]",
        icon: <XCircle className="size-[18px] shrink-0" />,
      };
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return {
        label: "Closed after dispute",
        badgeText: "text-white",
        badgePill: "bg-[#B45309]",
        containerBg: "bg-[#FFFBF0]",
        containerBorder: "border-[#F0E2C6]",
        icon: <AlertTriangle className="size-[18px] shrink-0" />,
      };
    default:
      return {
        label: status,
        badgeText: "text-white",
        badgePill: "bg-[#6B7280]",
        containerBg: "bg-white",
        containerBorder: "border-[#E6ECF2]",
        icon: null,
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
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 sm:px-4 ${config.containerBg} ${config.containerBorder}`}
    >
      <span className="text-xs font-medium text-[#272B36] sm:text-sm">Request Status</span>
      <span
        className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium sm:px-[18px] sm:py-[11px] sm:text-sm ${config.badgePill} ${config.badgeText}`}
      >
        {config.icon}
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

function IconRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:grid sm:grid-cols-[190px_1fr] sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 text-sm font-medium text-[#111827]">
        <span className="text-[#5B6778]">{icon}</span>
        {label}
      </div>
      <div className="break-words text-xs text-[#697386] sm:text-sm">{value || "--"}</div>
    </div>
  );
}

type TimelineEntry = {
  key: string;
  icon: ReactNode;
  label: string;
  date: string;
  by?: string;
};

function RequestHistory({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[#111827]">Request History</h3>
      <div className="mt-4 space-y-5">
        {entries.map((entry, index) => (
          <div key={entry.key} className="relative flex gap-3">
            {index < entries.length - 1 ? (
              <span className="absolute left-3 top-7 h-[calc(100%+4px)] w-px border-l border-dashed border-[#D5DEE8]" />
            ) : null}
            <span className="relative z-10 mt-0.5 shrink-0">{entry.icon}</span>
            <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div>
                <p className="text-sm font-medium text-[#111827]">{entry.label}</p>
                <p className="mt-1 text-sm text-[#7A8495]">{entry.date}</p>
              </div>
              {entry.by ? (
                <div className="sm:text-right">
                  <p className="text-sm text-[#7A8495]">Accepted by</p>
                  <p className="mt-1 text-sm text-[#697386]">{entry.by}</p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ServiceRequestDetailPanelProps {
  /** Invoked when the user navigates back to the request list. */
  onClose: () => void;
  request: ServiceRequestData;
}

export default function ServiceRequestDetailPanel({
  onClose,
  request,
}: ServiceRequestDetailPanelProps) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const markCompletedMutation = useBuyerMarkCompletedMutation();

  const [markingCompleted, setMarkingCompleted] = useState(false);
  const [drawerError, setDrawerError] = useState("");

  // Local override lets mutations (create / comment / evidence) reflect
  // immediately; otherwise the dispute is read from the query.
  const [disputeOverride, setDisputeOverride] =
    useState<ServiceDisputeData | null>(null);

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

  const engineerName = getPartyName(request.engineer);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [
      {
        key: "sent",
        icon: <Send className="size-5 text-[#2F80ED]" />,
        label: "Request Sent",
        date: formatDateTime(request.createdAt),
        by: engineerName,
      },
    ];

    if (request.status === ServiceRequestStatus.PENDING) {
      entries.unshift({
        key: "pending",
        icon: <Clock className="size-5 text-[#F08A32]" />,
        label: "Pending",
        date: formatDateTime(request.updatedAt),
        by: engineerName,
      });
    } else if (request.status === ServiceRequestStatus.REJECTED) {
      entries.unshift({
        key: "rejected",
        icon: <XCircle className="size-5 text-[#B91C1C]" />,
        label: "Rejected",
        date: formatDateTime(request.updatedAt),
        by: engineerName,
      });
    } else {
      entries.unshift({
        key: "accepted",
        icon: <CheckCircle2 className="size-5 text-[#1E9E4A]" />,
        label: statusConfig(request.status).label,
        date: formatDateTime(request.updatedAt),
        by: engineerName,
      });
    }

    return entries;
  }, [engineerName, request.createdAt, request.status, request.updatedAt]);

  const activeDisputeQuery = useServiceDisputeQuery(
    request.activeDisputeId,
    false,
    { enabled: Boolean(request.activeDisputeId) },
  );
  const disputeLoading = activeDisputeQuery.isPending && Boolean(request.activeDisputeId);

  const dispute = request.activeDisputeId
    ? disputeOverride ?? activeDisputeQuery.data ?? null
    : null;

  const disputeError =
    request.activeDisputeId && activeDisputeQuery.isError
      ? activeDisputeQuery.error instanceof Error
        ? activeDisputeQuery.error.message
        : "Failed to load the active dispute."
      : "";

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

      setDisputeOverride(result.data.dispute);
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

      setDisputeOverride(updatedDispute);
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

      setDisputeOverride(updatedDispute);
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
      <section className="p-3 sm:p-5 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="sr-only">Service request details</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6ECF2] px-3 py-2 text-xs font-medium text-[#4B5563] transition-colors hover:bg-[#F9FAFB]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to requests
          </button>
        </div>

        <div className="mx-auto mt-3 max-w-[910px] rounded-2xl border border-[#D1D9E3] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.025)] sm:mt-5 sm:p-8">
          <div className="space-y-5 sm:space-y-7">
            <StatusBadge status={request.status} />

            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-[27px]">
                {request.equipmentName || "--"}
              </h2>
              {request.model || request.brand ? (
                <p className="mt-1 text-xs text-[#697386] sm:text-sm">
                  Model: {request.model || request.brand}
                </p>
              ) : null}
            </div>

            {request.jobType ? (
              <span className="inline-flex items-center rounded-lg border border-[#1683FF] bg-[#EAF6FF] px-5 py-3 text-xs font-medium text-[#1F4773] sm:text-sm">
                {request.jobType}
              </span>
            ) : null}

            <div className="border-y border-[#E5EAF0] py-2 sm:py-3">
              <IconRow
                icon={<MapPin className="size-4" />}
                label="Location"
                value={request.serviceLocation}
              />
              <IconRow
                icon={<Clock className="size-4" />}
                label="Requested On"
                value={formatDateTime(request.createdAt)}
              />
              <IconRow
                icon={<FileText className="size-4" />}
                label="Description"
                value={request.serviceDescription}
              />
            </div>

            {/* Status-based action panel */}
            <div className={request.status === ServiceRequestStatus.ACCEPTED || request.status === ServiceRequestStatus.IN_PROGRESS ? "border-b border-[#E5EAF0] pb-6" : ""}>
              {request.status === ServiceRequestStatus.ACCEPTED || request.status === ServiceRequestStatus.IN_PROGRESS ? (
                <h3 className="text-base font-semibold text-[#111827]">Action</h3>
              ) : null}
              <div className="mt-3">
                {request.status === ServiceRequestStatus.ACCEPTED ||
                request.status === ServiceRequestStatus.IN_PROGRESS ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/dashboard/buyer/messages"
                      className="flex min-h-[90px] items-center justify-between gap-3 rounded-xl bg-[#079C3D] px-5 py-4 text-white transition-colors hover:bg-[#078536]"
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className="size-5 shrink-0" />
                        <span className="text-left">
                          <span className="block text-sm font-semibold">
                            Chat with Engineer
                          </span>
                          <span className="block text-xs text-white/80">
                            Discuss details in next steps
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                    <div className="flex min-h-[90px] items-start gap-3 rounded-xl border border-[#1683FF] px-5 py-4">
                      <Bell className="size-5 shrink-0 text-[#2F80ED]" />
                      <span className="text-sm">
                        <span className="block font-medium text-[#111827]">
                          Engineer accepted your request.
                        </span>
                        <span className="block text-xs text-[#6B7280]">
                          You can chat and finalize the details.
                        </span>
                      </span>
                    </div>
                  </div>
                ) : request.status === ServiceRequestStatus.PENDING ? (
                  <button type="button" className="flex min-h-[68px] items-start gap-3 rounded-xl border border-[#1683FF] px-5 py-4 text-left transition-colors hover:bg-[#F5FAFF]">
                    <Bell className="size-5 shrink-0 text-[#2F80ED]" />
                    <span className="text-sm">
                      <span className="block font-semibold text-[#2F80ED]">
                        Send Reminder
                      </span>
                      <span className="block text-xs text-[#6B7280]">
                        Remind the Engineer
                      </span>
                    </span>
                  </button>
                ) : request.status === ServiceRequestStatus.REJECTED ? (
                  <div className="flex min-h-[68px] items-start gap-3 rounded-xl border border-[#1683FF] px-5 py-4">
                    <Bell className="size-5 shrink-0 text-[#2F80ED]" />
                    <span className="text-sm">
                      <span className="block font-medium text-[#111827]">
                        Engineer rejected your request.
                      </span>
                      <span className="block text-xs text-[#6B7280]">
                        You can request again
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <RequestHistory entries={timelineEntries} />

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
        </div>
      </section>

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
