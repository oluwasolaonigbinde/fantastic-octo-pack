"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Filter,
  Scale,
  Search,
} from "lucide-react";

import Header from "../../component/header";
import { Button, SummaryCard } from "@/components/base";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { useAppSelector } from "@/hooks/useAppSelector";
import { serviceDisputeService } from "@/services/serviceDisputeService";
import {
  ServiceDisputeData,
  ServiceDisputeResolutionOutcome,
  ServiceDisputeStatus,
} from "@/types/service-dispute";
import { UserRole } from "@/types/user";

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

export default function AdminDisputesPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);

  const [disputes, setDisputes] = useState<ServiceDisputeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<ServiceDisputeData | null>(
    null,
  );
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [resolveBusy, setResolveBusy] = useState(false);
  const [requestEvidenceBusy, setRequestEvidenceBusy] = useState(false);

  const loadDisputes = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextDisputes = await serviceDisputeService.fetchServiceDisputes(
        token,
        true,
      );
      setDisputes(nextDisputes);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to load dispute records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDisputes();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedDisputeId) {
      setSelectedDispute(null);
      setSelectedError("");
      return;
    }

    let isMounted = true;

    const loadSelectedDispute = async () => {
      setSelectedLoading(true);
      setSelectedError("");

      try {
        const nextDispute = await serviceDisputeService.fetchServiceDisputeById(
          token,
          selectedDisputeId,
          true,
        );

        if (isMounted) {
          setSelectedDispute(nextDispute);
        }
      } catch (nextError) {
        if (isMounted) {
          setSelectedError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to load dispute detail.",
          );
        }
      } finally {
        if (isMounted) {
          setSelectedLoading(false);
        }
      }
    };

    void loadSelectedDispute();

    return () => {
      isMounted = false;
    };
  }, [selectedDisputeId, token]);

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

  const handleAddComment = async () => {
    if (!token || !selectedDispute || !commentDraft.trim()) {
      return;
    }

    setCommentBusy(true);
    setSelectedError("");

    try {
      const updatedDispute = await serviceDisputeService.addServiceDisputeComment(
        token,
        selectedDispute._id,
        commentDraft.trim(),
      );

      setSelectedDispute(updatedDispute);
      setCommentDraft("");
      await loadDisputes();
    } catch (nextError) {
      setSelectedError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to add dispute comment.",
      );
    } finally {
      setCommentBusy(false);
    }
  };

  const handleRequestEvidence = async () => {
    if (!token || !selectedDispute) {
      return;
    }

    setRequestEvidenceBusy(true);
    setSelectedError("");

    try {
      const response = await serviceDisputeService.requestServiceDisputeEvidence(
        token,
        selectedDispute._id,
      );

      setSelectedDispute(response.data.dispute);
      await loadDisputes();
    } catch (nextError) {
      setSelectedError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to request more evidence.",
      );
    } finally {
      setRequestEvidenceBusy(false);
    }
  };

  const handleResolve = async (
    outcome: ServiceDisputeResolutionOutcome,
  ) => {
    if (!token || !selectedDispute) {
      return;
    }

    setResolveBusy(true);
    setSelectedError("");

    try {
      const response = await serviceDisputeService.resolveServiceDispute(
        token,
        selectedDispute._id,
        {
          resolutionOutcome: outcome,
        },
      );

      setSelectedDispute(response.data.dispute);
      await loadDisputes();
    } catch (nextError) {
      setSelectedError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to resolve the dispute.",
      );
    } finally {
      setResolveBusy(false);
    }
  };

  const detailView = selectedDisputeId != null;

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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Total disputes"
                  value={String(summary.total)}
                  icon={<Scale size={18} className="text-primary" />}
                  iconBg="bg-[#E7F1FF]"
                />
                <SummaryCard
                  title="Awaiting evidence"
                  value={String(summary.awaitingEvidence)}
                  icon={<Search size={18} className="text-[#C04FE0]" />}
                  iconBg="bg-[#F8E8FF]"
                />
                <SummaryCard
                  title="Resolved disputes"
                  value={String(summary.resolved)}
                  icon={<CheckCircle2 size={18} className="text-[#13A83B]" />}
                  iconBg="bg-[#E8FAEE]"
                />
                <SummaryCard
                  title="Pending review"
                  value={String(summary.pendingReview)}
                  icon={<AlertTriangle size={18} className="text-[#F6B90A]" />}
                  iconBg="bg-[#FFF5DB]"
                />
              </div>

              <section className="card space-y-4">
                <div>
                  <h3 className="medium3 text-gray1">All Disputes</h3>
                  <p className="text-sm text-gray3">View all disputes logs</p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
                  Filter table list by:
                </p>
                <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray3">
                      Disputes status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm text-[#111827] outline-none"
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
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(event) => setDateFilter(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none"
                    />
                  </div>
                  <Button
                    title="Filter"
                    iconLeft={<Filter size={16} />}
                    className="self-end"
                    type="button"
                  />
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
                  <div className="overflow-x-auto rounded-2xl border border-gray5">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="text-xs font-medium text-gray3">
                          <th className="pb-3 pr-4">Dispute ID</th>
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
                              colSpan={6}
                              className="py-8 text-center text-sm text-gray3"
                            >
                              No disputes found.
                            </td>
                          </tr>
                        ) : (
                          filteredDisputes.map((dispute) => (
                            <tr key={dispute._id} className="border-t border-[#EEF2F7]">
                              <td className="py-4 pr-4 font-medium text-gray1">
                                {dispute._id}
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
                                  onClick={() => setSelectedDisputeId(dispute._id)}
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
                onClick={() => {
                  setSelectedDisputeId(null);
                  setCommentDraft("");
                  setSelectedError("");
                }}
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
                        <p className="mt-2 text-sm font-semibold text-[#F08A32]">
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
                    <h3 className="text-sm font-semibold text-[#111827]">
                      Previous notes on dispute ({selectedDispute.comments.length})
                    </h3>

                    {selectedDispute.comments.length === 0 ? (
                      <p className="mt-4 text-sm text-[#6B7280]">
                        No previous notes have been added yet.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {selectedDispute.comments.map((comment, index) => (
                          <div
                            key={`${comment.createdAt}-${index}`}
                            className="rounded-xl bg-[#F9FAFB] px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-[#111827]">
                                {getPartyName(comment.author)}
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
