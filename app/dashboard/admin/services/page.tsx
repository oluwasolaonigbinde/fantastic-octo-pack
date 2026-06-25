"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  SlidersHorizontal,
  SquareCheck,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, SummaryCard } from "@/components/base";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { useAppSelector } from "@/hooks/useAppSelector";
import { ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import serviceRequestService from "@/services/serviceRequestService";
import {
  ServiceRequestData,
  ServiceRequestStatus,
} from "@/types/service-request";
import { UserRole } from "@/types/user";

const NOT_AVAILABLE = "Not available";

function getPartyName(
  party: ServiceRequestData["requester"] | ServiceRequestData["engineer"],
): string {
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

  return NOT_AVAILABLE;
}

function getRequesterPhone(request: ServiceRequestData): string {
  if (
    request.requester &&
    typeof request.requester === "object" &&
    "phoneNumber" in request.requester
  ) {
    return request.requester.phoneNumber || ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.requesterPhone;
  }

  return ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.requesterPhone;
}

function getRequesterEmail(request: ServiceRequestData): string {
  if (
    request.requester &&
    typeof request.requester === "object" &&
    "email" in request.requester
  ) {
    return request.requester.email || ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.requesterEmail;
  }

  return ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.requesterEmail;
}

function formatDate(value?: string): string {
  if (!value) {
    return NOT_AVAILABLE;
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

function formatDateTime(value?: string): string {
  if (!value) {
    return NOT_AVAILABLE;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(parsedDate)
    .toLowerCase();

  return `${datePart} - ${timePart}`;
}

function isOngoingStatus(status: ServiceRequestStatus): boolean {
  return (
    status === ServiceRequestStatus.ACCEPTED ||
    status === ServiceRequestStatus.IN_PROGRESS
  );
}

function isOverdueRequest(request: ServiceRequestData): boolean {
  if (!request.preferredDate) {
    return false;
  }

  if (
    request.status !== ServiceRequestStatus.PENDING &&
    !isOngoingStatus(request.status)
  ) {
    return false;
  }

  if (typeof request.overdue === "boolean") {
    return request.overdue;
  }

  const preferredDate = new Date(request.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    return false;
  }

  const requestDay = new Date(
    preferredDate.getFullYear(),
    preferredDate.getMonth(),
    preferredDate.getDate(),
  );
  const currentDay = new Date();
  const today = new Date(
    currentDay.getFullYear(),
    currentDay.getMonth(),
    currentDay.getDate(),
  );

  return requestDay.getTime() < today.getTime();
}

function serviceStatusLabel(status: ServiceRequestStatus): string {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return "Pending";
    case ServiceRequestStatus.ACCEPTED:
    case ServiceRequestStatus.IN_PROGRESS:
      return "Ongoing";
    case ServiceRequestStatus.COMPLETED:
      return "Completed";
    case ServiceRequestStatus.REJECTED:
      return "Rejected";
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "Closed after dispute";
    default:
      return status;
  }
}

function statusClassName(status: ServiceRequestStatus): string {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return "text-warning";
    case ServiceRequestStatus.ACCEPTED:
    case ServiceRequestStatus.IN_PROGRESS:
      return "text-primary";
    case ServiceRequestStatus.COMPLETED:
      return "text-success";
    case ServiceRequestStatus.REJECTED:
      return "text-[#B91C1C]";
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "text-[#B45309]";
    default:
      return "text-gray3";
  }
}


export default function AdminServicesPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);

  const [requests, setRequests] = useState<ServiceRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requestTypeFilter, setRequestTypeFilter] = useState("");
  const [distributorFilter, setDistributorFilter] = useState("");

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestData | null>(
    null,
  );
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState("");

  const loadRequests = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await serviceRequestService.fetchAdminServiceRequests(token);
      setRequests(response.data.docs);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to load service requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRequests(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRequests]);

  useEffect(() => {
    if (!token || !selectedRequestId) {
      const timeoutId = window.setTimeout(() => {
        setSelectedRequest(null);
        setSelectedError("");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    let isMounted = true;

    const loadSelectedRequest = async () => {
      setSelectedLoading(true);
      setSelectedError("");

      try {
        const response = await serviceRequestService.fetchAdminServiceRequestById(
          token,
          selectedRequestId,
        );

        if (isMounted) {
          setSelectedRequest(response.data);
        }
      } catch (nextError) {
        if (isMounted) {
          setSelectedError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to load the service detail.",
          );
        }
      } finally {
        if (isMounted) {
          setSelectedLoading(false);
        }
      }
    };

    void loadSelectedRequest();

    return () => {
      isMounted = false;
    };
  }, [selectedRequestId, token]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesRequestType = request.jobType
        .toLowerCase()
        .includes(requestTypeFilter.trim().toLowerCase());
      const requesterName = getPartyName(request.requester).toLowerCase();
      const matchesDistributor = requesterName.includes(
        distributorFilter.trim().toLowerCase(),
      );

      return matchesRequestType && matchesDistributor;
    });
  }, [distributorFilter, requestTypeFilter, requests]);

  const summary = useMemo(() => {
    return {
      pending: requests.filter(
        (request) => request.status === ServiceRequestStatus.PENDING,
      ).length,
      ongoing: requests.filter((request) => isOngoingStatus(request.status)).length,
      completed: requests.filter(
        (request) => request.status === ServiceRequestStatus.COMPLETED,
      ).length,
      overdue: requests.filter((request) => isOverdueRequest(request)).length,
    };
  }, [requests]);

  const activeRequest = useMemo(
    () => selectedRequest ?? requests.find((request) => request._id === selectedRequestId) ?? null,
    [requests, selectedRequest, selectedRequestId],
  );

  return (
    <ProtectedRoute
      requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
    >
      <div>
        <Header
          title="Services"
          description="View and track all service requests and services"
        />

        <div className="space-y-8 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total pending services"
              value={String(summary.pending)}
              icon={<SquareCheck size={18} className="text-[#D946EF]" />}
              iconBg="bg-[#F8E8FF]"
              subtitle="Pending queue"
            />
            <SummaryCard
              title="Total ongoing services"
              value={String(summary.ongoing)}
              icon={<SquareCheck size={18} className="text-[#D946EF]" />}
              iconBg="bg-[#F8E8FF]"
              subtitle="Accepted and in progress"
            />
            <SummaryCard
              title="Total completed services"
              value={String(summary.completed)}
              icon={<SquareCheck size={18} className="text-[#D946EF]" />}
              iconBg="bg-[#F8E8FF]"
              subtitle="Completed requests"
            />
            <SummaryCard
              title="Total overdue requests"
              value={String(summary.overdue)}
              icon={<SquareCheck size={18} className="text-[#D946EF]" />}
              iconBg="bg-[#F8E8FF]"
              subtitle="Past preferred date"
            />
          </div>

          <section className="card space-y-4">
            <h3 className="medium3 text-gray1">All Service requests</h3>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
              Filter table list by:
            </p>
            <div className="grid gap-3 lg:grid-cols-[2fr_2fr_auto]">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray3">
                  Request type
                </label>
                <input
                  type="text"
                  value={requestTypeFilter}
                  onChange={(event) => setRequestTypeFilter(event.target.value)}
                  placeholder="Enter request type"
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray3">
                  Distributor name
                </label>
                <input
                  type="text"
                  value={distributorFilter}
                  onChange={(event) => setDistributorFilter(event.target.value)}
                  placeholder="Enter distributor name"
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>
              <Button
                title="Filter"
                iconLeft={<SlidersHorizontal size={16} />}
                className="self-end"
                type="button"
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#E6ECF2] bg-white p-6 text-sm text-[#6B7280]">
                Loading service requests...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p>{error}</p>
                <Button
                  title="Retry"
                  type="button"
                  onClick={() => void loadRequests()}
                  className="mt-3 w-auto"
                />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray5">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-medium text-gray3">
                      <th className="pb-3 pr-4">Distributor&apos;s name</th>
                      <th className="pb-3 pr-4">Product&apos;s name</th>
                      <th className="pb-3 pr-4">Request type</th>
                      <th className="pb-3 pr-4">Assigned engineer</th>
                      <th className="pb-3 pr-4">Buyer&apos;s name</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-center text-sm text-gray3"
                        >
                          No service requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr key={request._id} className="border-t border-[#EEF2F7]">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="size-8 shrink-0 rounded-xl bg-gray5" />
                              <span className="font-medium text-gray1">
                                {getPartyName(request.requester)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 pr-4">{request.equipmentName}</td>
                          <td className="py-4 pr-4">{request.jobType}</td>
                          <td className="py-4 pr-4">
                            {getPartyName(request.engineer)}
                          </td>
                          <td className="py-4 pr-4">
                            {getPartyName(request.requester)}
                          </td>
                          <td className="py-4 pr-4 whitespace-nowrap">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`text-xs font-medium ${statusClassName(request.status)}`}
                            >
                              {serviceStatusLabel(request.status)}
                            </span>
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedRequestId(request._id)}
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
        </div>

        <Dialog
          open={selectedRequestId != null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedRequestId(null);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[500px]">
            <DialogHeader className="border-b border-[#E6ECF2] px-10 pb-5 pt-10">
              <DialogTitle className="text-[28px] font-semibold text-[#111827]">
                Service Details
              </DialogTitle>
            </DialogHeader>

            {selectedLoading ? (
              <div className="px-10 py-6 text-sm text-[#6B7280]">
                Loading service detail...
              </div>
            ) : selectedError ? (
              <div className="mx-10 my-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {selectedError}
              </div>
            ) : activeRequest ? (
              <div className="space-y-4 px-10 pb-10 pt-6">
                <div className="rounded-[24px] bg-[#FFF4D8] px-8 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#6B7280]">
                      Request Status
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A2E] px-4 py-2 text-sm font-semibold text-white">
                      <SquareCheck className="size-4" />
                      {serviceStatusLabel(activeRequest.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#6B7280]">Distributor&apos;s name</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {getPartyName(activeRequest.requester)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">
                      Distributor&apos;s phone number
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {getRequesterPhone(activeRequest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">
                      Distributor&apos;s email address
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {getRequesterEmail(activeRequest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Product name</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {activeRequest.equipmentName || ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.productName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Request type</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {activeRequest.jobType || ADMIN_SERVICE_DETAIL_FIGMA_FALLBACK.requestType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Assigned engineer</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {getPartyName(activeRequest.engineer)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Date of request</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {formatDateTime(activeRequest.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Proposed delivery date</p>
                    <p className="mt-1 text-sm font-medium text-[#111827]">
                      {formatDate(activeRequest.preferredDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Additional note</p>
                    <p className="mt-1 text-sm leading-6 text-[#111827]">
                      {activeRequest.serviceDescription || NOT_AVAILABLE}
                    </p>
                  </div>
                </div>

                <Button
                  title="Re-assign service engineer"
                  type="button"
                  disabled
                  className="mt-4"
                />
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
