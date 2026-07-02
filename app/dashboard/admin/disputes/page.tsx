"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  FileText,
  MessageCircleMore,
  SearchCheck,
  SlidersHorizontal,
  SquareCheck,
} from "lucide-react";

import Header from "../../component/header";
import { Button, SummaryCard } from "@/components/base";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import {
  useAddServiceDisputeCommentMutation,
  useRequestServiceDisputeEvidenceMutation,
  useResolveServiceDisputeMutation,
  useServiceDisputeQuery,
  useServiceDisputesQuery,
} from "@/hooks/queries/service-disputes";
import { ServiceRequestData } from "@/types/service-request";
import {
  ServiceDisputeData,
  ServiceDisputeResolutionOutcome,
  ServiceDisputeStatus,
} from "@/types/service-dispute";
import { UserRole } from "@/types/user";

const DISPUTE_NOTE_ACCENTS = ["bg-[#2F6BFF]", "bg-[#F6B90A]", "bg-[#22C55E]"] as const;

function getPartyName(
  party:
    | string
    | {
        firstName?: string;
        lastName?: string;
        email?: string;
      }
    | undefined,
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

function parseFilterDate(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const compactDateMatch = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
  if (!compactDateMatch) {
    return "";
  }

  const [, dayValue, monthValue, rawYearValue] = compactDateMatch;
  const yearValue =
    rawYearValue.length === 2 ? `20${rawYearValue}` : rawYearValue;
  const isoValue = `${yearValue}-${monthValue}-${dayValue}`;
  const parsedDate = new Date(`${isoValue}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  if (
    parsedDate.getUTCFullYear() !== Number(yearValue) ||
    parsedDate.getUTCMonth() + 1 !== Number(monthValue) ||
    parsedDate.getUTCDate() !== Number(dayValue)
  ) {
    return "";
  }

  return isoValue;
}

function formatFilterDateInput(value: string): string {
  if (!value) {
    return "";
  }

  const [yearValue, monthValue, dayValue] = value.split("-");
  if (!yearValue || !monthValue || !dayValue) {
    return value;
  }

  return `${dayValue}/${monthValue}/${yearValue.slice(-2)}`;
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

function disputeStatusClassName(status: ServiceDisputeStatus): string {
  switch (status) {
    case ServiceDisputeStatus.UNDER_REVIEW:
      return "text-primary";
    case ServiceDisputeStatus.AWAITING_EVIDENCE:
      return "text-warning";
    case ServiceDisputeStatus.RESOLVED:
      return "text-success";
    default:
      return "text-gray3";
  }
}

function resolutionOutcomeLabel(
  outcome?: ServiceDisputeResolutionOutcome,
): string {
  switch (outcome) {
    case ServiceDisputeResolutionOutcome.CONTINUE_SERVICE:
      return "Continue service";
    case ServiceDisputeResolutionOutcome.MARK_COMPLETED:
      return "Mark completed";
    case ServiceDisputeResolutionOutcome.CLOSED_AFTER_DISPUTE:
      return "Close after dispute";
    default:
      return "Pending";
  }
}

function getServiceRequestId(dispute: ServiceDisputeData): string {
  if (
    dispute.serviceRequest &&
    typeof dispute.serviceRequest === "object" &&
    "_id" in dispute.serviceRequest
  ) {
    return dispute.serviceRequest._id;
  }

  return typeof dispute.serviceRequest === "string" ? dispute.serviceRequest : "--";
}

function getServiceRequest(dispute: ServiceDisputeData): ServiceRequestData | null {
  return dispute.serviceRequest && typeof dispute.serviceRequest === "object"
    ? dispute.serviceRequest
    : null;
}

function getServiceRequestField(
  dispute: ServiceDisputeData,
  key: "equipmentName" | "jobType",
): string {
  if (
    dispute.serviceRequest &&
    typeof dispute.serviceRequest === "object" &&
    key in dispute.serviceRequest
  ) {
    const value = dispute.serviceRequest[key];
    return typeof value === "string" && value.length > 0 ? value : "--";
  }

  return "--";
}

function deriveResolutionSummaryQuantity(
  serviceRequest: ServiceRequestData | null,
): string {
  if (!serviceRequest) {
    return "";
  }

  const unitPrice = serviceRequest.unitPrice;
  const totalAmount = serviceRequest.price ?? serviceRequest.unitPrice;

  if (
    typeof unitPrice !== "number" ||
    !Number.isFinite(unitPrice) ||
    unitPrice <= 0 ||
    typeof totalAmount !== "number" ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0
  ) {
    return "";
  }

  const quantity = totalAmount / unitPrice;

  return Number.isInteger(quantity) && quantity > 0 ? String(quantity) : "";
}

function buildResolutionSummaryHref(dispute: ServiceDisputeData): string {
  const params = new URLSearchParams();
  const serviceRequest = getServiceRequest(dispute);
  const invoiceId = getServiceRequestId(dispute);
  const itemName = getServiceRequestField(dispute, "equipmentName");
  const totalAmount = serviceRequest?.price ?? serviceRequest?.unitPrice;
  const quantity = deriveResolutionSummaryQuantity(serviceRequest);
  const buyerName = getPartyName(dispute.buyer);
  const distributorName = getPartyName(dispute.engineer);

  params.set("disputeId", dispute._id);

  if (invoiceId !== "--") {
    params.set("invoiceId", invoiceId);
  }

  if (itemName !== "--") {
    params.set("itemName", itemName);
  }

  if (typeof serviceRequest?.unitPrice === "number" && Number.isFinite(serviceRequest.unitPrice)) {
    params.set("unitPrice", String(serviceRequest.unitPrice));
  }

  if (typeof totalAmount === "number" && Number.isFinite(totalAmount)) {
    params.set("totalAmount", String(totalAmount));
  }

  if (quantity) {
    params.set("quantity", quantity);
  }

  if (buyerName !== "--") {
    params.set("buyerName", buyerName);
  }

  if (distributorName !== "--") {
    params.set("distributorName", distributorName);
  }

  if (dispute.createdAt) {
    params.set("dateCreated", dispute.createdAt);
  }

  return `/dashboard/admin/disputes/resolution-summary?${params.toString()}`;
}


function EvidenceList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; fileName: string; url: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280]">No attached document yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-3 py-3"
            >
              <span className="text-sm text-[#111827]">{item.fileName}</span>
              <div className="flex items-center gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary"
                >
                  View
                </a>
                <a
                  href={item.url}
                  download
                  className="text-sm font-medium text-[#34A853]"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeNoteCard({
  accentClassName,
  noteText,
  timestamp,
  senderLabel,
  attachment,
}: {
  accentClassName: string;
  noteText: string;
  timestamp: string;
  senderLabel: string;
  attachment?: {
    fileName: string;
    url: string;
  };
}) {
  return (
    <article className="relative rounded-2xl border border-[#EEF1F5] bg-[#FBFCFD] px-5 py-4">
      <div className="flex gap-4">
        <span className={`mt-1 w-[3px] shrink-0 rounded-full ${accentClassName}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-8 text-[#111827]">{noteText}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {attachment ? (
              <div className="flex flex-wrap items-center gap-5">
                <span className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
                  <FileText size={16} className="text-[#22C55E]" />
                  {attachment.fileName}
                </span>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-base text-[#FE6E00]"
                >
                  <Eye size={16} />
                  View
                </a>
              </div>
            ) : (
              <span />
            )}
            <p className="text-sm text-[#4B5563]">
              {senderLabel} {timestamp}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDisputeId = searchParams.get("disputeId");

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateInputValue, setDateInputValue] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [actionError, setActionError] = useState("");

  const disputesQuery = useServiceDisputesQuery(true);
  const disputes = useMemo(
    () => disputesQuery.data ?? [],
    [disputesQuery.data],
  );
  const loading = disputesQuery.isPending;
  const error = disputesQuery.isError
    ? disputesQuery.error instanceof Error
      ? disputesQuery.error.message
      : "Failed to load dispute records."
    : "";

  const selectedDisputeQuery = useServiceDisputeQuery(
    selectedDisputeId ?? undefined,
    true,
  );
  const selectedDispute = selectedDisputeQuery.data ?? null;
  const selectedLoading = Boolean(selectedDisputeId) && selectedDisputeQuery.isPending;
  const selectedError =
    actionError ||
    (selectedDisputeQuery.isError
      ? selectedDisputeQuery.error instanceof Error
        ? selectedDisputeQuery.error.message
        : "Failed to load dispute detail."
      : "");

  const addCommentMutation = useAddServiceDisputeCommentMutation();
  const resolveMutation = useResolveServiceDisputeMutation();
  const requestEvidenceMutation = useRequestServiceDisputeEvidenceMutation();

  const commentBusy = addCommentMutation.isPending;
  const resolveBusy = resolveMutation.isPending;
  const requestEvidenceBusy = requestEvidenceMutation.isPending;

  const loadDisputes = () => {
    void disputesQuery.refetch();
  };

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const matchesStatus = statusFilter ? dispute.status === statusFilter : true;
      const matchesDate = dateFilter
        ? new Date(dispute.createdAt).toISOString().slice(0, 10) === dateFilter
        : true;

      return matchesStatus && matchesDate;
    });
  }, [dateFilter, disputes, statusFilter]);

  const summary = useMemo(
    () => ({
      total: disputes.length,
      awaitingEvidence: disputes.filter(
        (dispute) => dispute.status === ServiceDisputeStatus.AWAITING_EVIDENCE,
      ).length,
      resolved: disputes.filter(
        (dispute) => dispute.status === ServiceDisputeStatus.RESOLVED,
      ).length,
      pendingReview: disputes.filter(
        (dispute) => dispute.status === ServiceDisputeStatus.UNDER_REVIEW,
      ).length,
    }),
    [disputes],
  );

  const displayYear = useMemo(() => {
    const candidate =
      filteredDisputes[0]?.createdAt || disputes[0]?.createdAt || new Date().toISOString();
    const parsedDate = new Date(candidate);

    return String(
      Number.isNaN(parsedDate.getTime())
        ? new Date().getFullYear()
        : parsedDate.getFullYear(),
    );
  }, [disputes, filteredDisputes]);

  const handleAddComment = async () => {
    if (!selectedDispute || !commentDraft.trim()) {
      return;
    }

    setActionError("");

    try {
      await addCommentMutation.mutateAsync({
        disputeId: selectedDispute._id,
        text: commentDraft.trim(),
      });
      setCommentDraft("");
    } catch (nextError) {
      setActionError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to add dispute comment.",
      );
    }
  };

  const handleRequestEvidence = async () => {
    if (!selectedDispute) {
      return;
    }

    setActionError("");

    try {
      await requestEvidenceMutation.mutateAsync({
        disputeId: selectedDispute._id,
      });
    } catch (nextError) {
      setActionError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to request more evidence.",
      );
    }
  };

  const handleResolve = async (
    outcome: ServiceDisputeResolutionOutcome,
  ) => {
    if (!selectedDispute) {
      return;
    }

    setActionError("");

    try {
      await resolveMutation.mutateAsync({
        disputeId: selectedDispute._id,
        payload: { resolutionOutcome: outcome },
      });
    } catch (nextError) {
      setActionError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to resolve the dispute.",
      );
    }
  };

  const detailView = Boolean(selectedDisputeId);
  const resolutionSummaryHref = useMemo(
    () =>
      selectedDispute
        ? buildResolutionSummaryHref(selectedDispute)
        : "/dashboard/admin/disputes/resolution-summary",
    [selectedDispute],
  );

  const handleDateInputChange = (value: string) => {
    setDateInputValue(value);
    setDateFilter(parseFilterDate(value));
  };

  const handleDateInputBlur = () => {
    if (!dateInputValue.trim()) {
      setDateFilter("");
      setDateInputValue("");
      return;
    }

    const parsedValue = parseFilterDate(dateInputValue);
    if (!parsedValue) {
      return;
    }

    setDateFilter(parsedValue);
    setDateInputValue(formatFilterDateInput(parsedValue));
  };

  const handleOpenDisputeDetail = (disputeId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("disputeId", disputeId);
    router.push(`/dashboard/admin/disputes?${nextParams.toString()}`);
  };

  const handleCloseDisputeDetail = () => {
    setCommentDraft("");
    setActionError("");
    router.push("/dashboard/admin/disputes");
  };

  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <Header
          title={detailView ? "Disputes Management" : "Disputes"}
          description={
            detailView
              ? "View all open and closed disputes"
              : "View and track all disputes records"
          }
        />

        <div className="space-y-8 p-4 md:p-6">
          {!detailView ? (
            <>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <SummaryCard
                  title="Total disputes"
                  value={String(summary.total)}
                  icon={<CircleDollarSign size={18} className="text-primary" />}
                  iconBg="bg-[#E7F1FF]"
                  subtitle={`${summary.total} records in queue`}
                />
                <SummaryCard
                  title="Awaiting evidence"
                  value={String(summary.awaitingEvidence)}
                  icon={<SearchCheck size={18} className="text-[#F08A32]" />}
                  iconBg="bg-[#FFF3E8]"
                  subtitle={`${summary.awaitingEvidence} need evidence`}
                />
                <SummaryCard
                  title="Resolved disputes"
                  value={String(summary.resolved)}
                  icon={<CheckCircle2 size={18} className="text-[#13A83B]" />}
                  iconBg="bg-[#E8FAEE]"
                  subtitle={`${summary.resolved} resolved cases`}
                />
                <SummaryCard
                  title="Pending review"
                  value={String(summary.pendingReview)}
                  icon={<FileText size={18} className="text-[#F6B90A]" />}
                  iconBg="bg-[#FFF5DB]"
                  subtitle={`${summary.pendingReview} under review`}
                />
              </div>

              <section className="card space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="medium3 text-gray1">All Disputes</h3>
                    <p className="mt-1 text-sm text-gray3">View all disputes logs</p>
                  </div>
                  <button
                    type="button"
                    className="hidden h-14 items-center justify-between rounded-2xl border border-[#E6ECF2] bg-white px-4 text-base text-[#667085] md:inline-flex md:w-[154px]"
                  >
                    <span>{displayYear}</span>
                    <CalendarDays className="size-5 text-[#667085]" />
                  </button>
                </div>
                <p className="text-sm text-gray3">
                  Filter table list by:
                </p>
                <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr_auto]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray1">
                      Disputes status
                    </label>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className={`h-14 w-full appearance-none rounded-2xl border border-[#E6ECF2] bg-white px-4 pr-12 text-base outline-none ${statusFilter ? "text-[#111827]" : "text-[#D0D5DD]"}`}
                      >
                        <option value="">Select status</option>
                        <option value={ServiceDisputeStatus.UNDER_REVIEW}>
                          Under review
                        </option>
                        <option value={ServiceDisputeStatus.AWAITING_EVIDENCE}>
                          Awaiting evidence
                        </option>
                        <option value={ServiceDisputeStatus.RESOLVED}>Resolved</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#667085]" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 hidden text-sm font-medium text-gray1 md:block">
                      Date
                    </label>
                    <label className="mb-2 block text-sm font-medium text-gray1 md:hidden">
                      Date &amp; time
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="DD/MM/YY"
                      value={dateInputValue}
                      onChange={(event) => handleDateInputChange(event.target.value)}
                      onBlur={handleDateInputBlur}
                      className="h-14 w-full rounded-2xl border border-[#E6ECF2] px-4 text-base text-[#111827] outline-none placeholder:text-[#D0D5DD]"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-14 items-center justify-center gap-3 self-end rounded-2xl bg-primary px-4 text-base font-medium text-white"
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filter</span>
                  </button>
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 text-sm text-[#6B7280]">
                    Loading dispute records...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p>{error}</p>
                    <Button
                      title="Retry"
                      type="button"
                      onClick={() => void loadDisputes()}
                      className="mt-3 w-auto"
                    />
                  </div>
                ) : (
                  <div className="mt-10 overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#EEF2F7] text-xs font-medium text-gray3">
                          <th className="pb-3 pr-4">Dispute ID</th>
                          <th className="pb-3 pr-4">Order ID</th>
                          <th className="pb-3 pr-4">Raised by</th>
                          <th className="pb-3 pr-4">Against</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Date raised</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDisputes.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-8 text-center text-sm text-gray3"
                            >
                              No disputes found.
                            </td>
                          </tr>
                        ) : (
                          filteredDisputes.map((dispute) => (
                            <tr key={dispute._id} className="border-t border-[#EEF2F7]">
                              <td className="py-4 pr-4 font-medium text-gray1">
                                <span className="inline-block max-w-[120px] truncate align-bottom">
                                  {dispute._id}
                                </span>
                              </td>
                              <td className="py-4 pr-4">
                                <span
                                  className="inline-block max-w-[140px] truncate align-bottom"
                                  title={getServiceRequestId(dispute)}
                                >
                                  {getServiceRequestId(dispute)}
                                </span>
                              </td>
                              <td className="py-4 pr-4">
                                {getPartyName(dispute.buyer)}
                              </td>
                              <td className="py-4 pr-4">
                                {getPartyName(dispute.engineer)}
                              </td>
                              <td className="py-4 pr-4">
                                <span
                                  className={`text-xs font-medium ${disputeStatusClassName(dispute.status)}`}
                                >
                                  {disputeStatusLabel(dispute.status)}
                                </span>
                              </td>
                              <td className="py-4 pr-4 whitespace-nowrap">
                                {formatDate(dispute.createdAt)}
                              </td>
                              <td className="py-4">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDisputeDetail(dispute._id)}
                                  className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCloseDisputeDetail}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563]"
              >
                <ArrowLeft className="size-4" />
                Go Back
              </button>

              {selectedLoading ? (
                <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 text-sm text-[#6B7280]">
                  Loading dispute detail...
                </div>
              ) : selectedError && !selectedDispute ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {selectedError}
                </div>
              ) : selectedDispute ? (
                <>
                  <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            Reason for dispute
                          </p>
                          <p className="mt-2 text-sm text-[#4B5563]">
                            {selectedDispute.reason}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            Description
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                            {selectedDispute.description}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#F4B183] bg-[#FFF8F2] px-4 py-3">
                        <p className="text-xs text-[#6B7280]">Request Status</p>
                        <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#FE6E00] px-4 py-2 text-sm font-semibold text-white">
                          <SquareCheck className="size-4" />
                          {disputeStatusLabel(selectedDispute.status)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 text-sm text-[#4B5563] md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Dispute ID</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {selectedDispute._id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Service request ID</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {getServiceRequestId(selectedDispute)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Item name</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {getServiceRequestField(selectedDispute, "equipmentName")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Request type</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {getServiceRequestField(selectedDispute, "jobType")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Raised by</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {getPartyName(selectedDispute.buyer)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Against</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {getPartyName(selectedDispute.engineer)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Date created</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {formatDate(selectedDispute.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Resolution outcome</p>
                        <p className="mt-1 font-medium text-[#111827]">
                          {resolutionOutcomeLabel(selectedDispute.resolutionOutcome)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <EvidenceList
                    title="Evidence added"
                    items={selectedDispute.evidence.map((item) => ({
                      id: item.cloudinary_id,
                      fileName: item.fileName,
                      url: item.url,
                    }))}
                  />

                  <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <MessageCircleMore size={20} className="text-[#0D7CF2]" />
                      <h3 className="text-sm font-semibold text-[#111827]">
                        Previous notes on dispute ({selectedDispute.comments.length})
                      </h3>
                    </div>

                    {selectedDispute.comments.length === 0 ? (
                      <p className="mt-4 text-sm text-[#6B7280]">
                        No previous notes have been added yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {selectedDispute.comments.map((comment, index) => (
                          <DisputeNoteCard
                            key={`${comment.createdAt}-${index}`}
                            accentClassName={
                              DISPUTE_NOTE_ACCENTS[index % DISPUTE_NOTE_ACCENTS.length]
                            }
                            noteText={comment.text}
                            timestamp={formatDate(comment.createdAt)}
                            senderLabel={`Sent by ${getPartyName(comment.author)}`}
                            attachment={
                              index === 0 && selectedDispute.evidence[0]
                                ? {
                                    fileName: selectedDispute.evidence[0].fileName,
                                    url: selectedDispute.evidence[0].url,
                                  }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}

                    <Link
                      href={resolutionSummaryHref}
                      className="mt-6 inline-flex items-center gap-3 text-base font-medium text-primary"
                    >
                      See resolution summary
                      <ArrowRight size={16} />
                    </Link>
                  </section>

                  <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
                    <EvidenceList
                      title="Evidence check"
                      items={selectedDispute.evidence.map((item) => ({
                        id: item.cloudinary_id,
                        fileName: item.fileName,
                        url: item.url,
                      }))}
                    />

                    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
                      <h3 className="text-sm font-semibold text-[#111827]">
                        Add comment (optional)
                      </h3>
                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Enter text here..."
                        className="mt-4 min-h-[140px] w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <Button
                        title="Add comment"
                        type="button"
                        disabled={commentBusy || commentDraft.trim().length === 0}
                        isBusy={commentBusy}
                        onClick={() => void handleAddComment()}
                        className="mt-4 w-auto"
                      />
                    </section>
                  </div>

                  {selectedError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      {selectedError}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
                    <Button
                      title="Request for evidence"
                      type="button"
                      disabled={
                        requestEvidenceBusy ||
                        selectedDispute.status === ServiceDisputeStatus.RESOLVED
                      }
                      isBusy={requestEvidenceBusy}
                      onClick={() => void handleRequestEvidence()}
                      className="w-full lg:w-auto"
                    />
                    <Button
                      title="Continue service"
                      type="button"
                      variant="primaryLight"
                      disabled={
                        resolveBusy ||
                        selectedDispute.status === ServiceDisputeStatus.RESOLVED
                      }
                      isBusy={resolveBusy}
                      onClick={() =>
                        void handleResolve(
                          ServiceDisputeResolutionOutcome.CONTINUE_SERVICE,
                        )
                      }
                      className="w-full lg:w-auto"
                    />
                    <Button
                      title="Mark completed"
                      type="button"
                      variant="primaryLight"
                      disabled={
                        resolveBusy ||
                        selectedDispute.status === ServiceDisputeStatus.RESOLVED
                      }
                      isBusy={resolveBusy}
                      onClick={() =>
                        void handleResolve(
                          ServiceDisputeResolutionOutcome.MARK_COMPLETED,
                        )
                      }
                      className="w-full lg:w-auto"
                    />
                    <Button
                      title="Close after dispute"
                      type="button"
                      variant="primaryLight"
                      disabled={
                        resolveBusy ||
                        selectedDispute.status === ServiceDisputeStatus.RESOLVED
                      }
                      isBusy={resolveBusy}
                      onClick={() =>
                        void handleResolve(
                          ServiceDisputeResolutionOutcome.CLOSED_AFTER_DISPUTE,
                        )
                      }
                      className="w-full lg:w-auto"
                    />
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
