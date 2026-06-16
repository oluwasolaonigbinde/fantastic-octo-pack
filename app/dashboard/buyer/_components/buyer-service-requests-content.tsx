"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CircleDollarSign,
  Eye,
  Filter,
  RotateCcw,
  Users,
} from "lucide-react";

import { Spinner } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  ServiceRequestData,
  ServiceRequestStatus,
} from "@/types/service-request";

import { OverviewSectionHeading } from "../../component/overview-primitives";
import ServiceRequestDetailDrawer from "./service-request-detail-drawer";

function formatRequestId(id: string): string {
  const tail = String(id).slice(-6).toUpperCase();
  return `JR-${tail}`;
}

function formatSchedule(preferredDate: string, preferredTime?: string): string {
  try {
    const parsedDate = new Date(preferredDate);
    const datePart = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(parsedDate);

    return preferredTime ? `${datePart} - ${preferredTime}` : datePart;
  } catch {
    return preferredDate;
  }
}

function formatCurrency(value?: number): string {
  if (typeof value !== "number") {
    return "--";
  }

  return `NGN ${value.toLocaleString("en-NG")}`;
}

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

function tableStatusDisplay(status: ServiceRequestStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return { label: "Pending", className: "text-[#D89A2D]" };
    case ServiceRequestStatus.ACCEPTED:
    case ServiceRequestStatus.IN_PROGRESS:
      return { label: "Ongoing", className: "text-[#D97627]" };
    case ServiceRequestStatus.COMPLETED:
      return { label: "Completed", className: "text-[#34A853]" };
    case ServiceRequestStatus.REJECTED:
      return { label: "Rejected", className: "text-[#B91C1C]" };
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return { label: "Closed after dispute", className: "text-[#B45309]" };
    default:
      return { label: status, className: "text-[#6B7280]" };
  }
}

function padCount(value: number): string {
  return String(value).padStart(2, "0");
}

function applyTableFilters(
  requests: ServiceRequestData[],
  requestIdFilter: string,
  statusFilter: string,
  dateFilter: string,
): ServiceRequestData[] {
  let filteredRequests = [...requests].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  const normalizedRequestId = requestIdFilter.trim().toUpperCase();
  if (normalizedRequestId) {
    filteredRequests = filteredRequests.filter((request) => {
      const rawId = String(request._id).toUpperCase();
      const uiId = formatRequestId(request._id).toUpperCase();
      return rawId.includes(normalizedRequestId) || uiId.includes(normalizedRequestId);
    });
  }

  if (statusFilter === "ongoing") {
    filteredRequests = filteredRequests.filter(
      (request) =>
        request.status === ServiceRequestStatus.ACCEPTED ||
        request.status === ServiceRequestStatus.IN_PROGRESS,
    );
  } else if (statusFilter) {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === statusFilter,
    );
  }

  if (dateFilter.trim()) {
    filteredRequests = filteredRequests.filter((request) => {
      const requestDate = new Date(request.preferredDate);
      if (Number.isNaN(requestDate.getTime())) {
        return false;
      }

      return requestDate.toISOString().slice(0, 10) === dateFilter;
    });
  }

  return filteredRequests;
}

export function BuyerServiceRequestKpiStrip() {
  const { serviceRequests } = useAppSelector((state) => state.serviceRequest);

  const thisMonthRequests = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return serviceRequests.filter((request) => {
      const createdAt = new Date(request.createdAt);
      return (
        createdAt.getFullYear() === currentYear &&
        createdAt.getMonth() === currentMonth
      );
    });
  }, [serviceRequests]);

  const completedThisMonth = useMemo(
    () =>
      thisMonthRequests.filter(
        (request) => request.status === ServiceRequestStatus.COMPLETED,
      ).length,
    [thisMonthRequests],
  );

  const cards = [
    {
      title: "Total engineers available",
      value: "--",
      meta: "This month",
      accent: "#E5F1FF",
      icon: <Users className="size-5 text-[#2F80ED]" strokeWidth={1.75} />,
    },
    {
      title: "Engineers with OEM certified",
      value: "--",
      meta: "This month",
      accent: "#FCE7F3",
      icon: <Award className="size-5 text-[#DB2777]" strokeWidth={1.75} />,
    },
    {
      title: "Total engineers requested",
      value: padCount(thisMonthRequests.length),
      meta: "This month",
      accent: "#E7F9EC",
      icon: (
        <CircleDollarSign
          className="size-5 text-[#22A45D]"
          strokeWidth={1.75}
        />
      ),
    },
    {
      title: "Completed services",
      value: padCount(completedThisMonth),
      meta: "This month",
      accent: "#FFF4D8",
      icon: <RotateCcw className="size-5 text-[#D89A2D]" strokeWidth={1.75} />,
    },
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[#6B7280]">{card.title}</p>
              <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">
                {card.value}
              </p>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">{card.meta}</p>
            </div>
            <span
              className="inline-flex size-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: card.accent }}
            >
              {card.icon}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function BuyerServiceRequestsQuickLinks() {
  return (
    <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Quick Links</h2>
          <p className="text-sm text-[#6B7280]">
            What would you like to perform?
          </p>
        </div>
        <Link
          href="/dashboard/buyer/service-engineers"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF7A2E] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#F06E25]"
        >
          See all service engineers
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

type BuyerServiceRequestsFilterPanelProps = {
  requestIdFilter: string;
  statusFilter: string;
  dateFilter: string;
  onRequestIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFilter: () => void;
  onReset: () => void;
};

export function BuyerServiceRequestsFilterPanel({
  requestIdFilter,
  statusFilter,
  dateFilter,
  onRequestIdChange,
  onStatusChange,
  onDateChange,
  onFilter,
  onReset,
}: BuyerServiceRequestsFilterPanelProps) {
  return (
    <div id="engineer-requests" className="p-5 pb-4">
      <OverviewSectionHeading
        title="All Engineer Requests"
        subtitle="Filter table list by:"
      />
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111827]">Request ID</label>
          <input
            aria-label="Request ID filter"
            type="text"
            placeholder="Enter ID"
            value={requestIdFilter}
            onChange={(event) => onRequestIdChange(event.target.value)}
            className="h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#C4C8CE]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111827]">Status badge</label>
          <select
            aria-label="Status filter"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm text-[#111827] outline-none"
          >
            <option value="">Select status</option>
            <option value={ServiceRequestStatus.PENDING}>Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value={ServiceRequestStatus.REJECTED}>Rejected</option>
            <option value={ServiceRequestStatus.COMPLETED}>Completed</option>
            <option value={ServiceRequestStatus.CLOSED_AFTER_DISPUTE}>
              Closed after dispute
            </option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111827]">Date submitted</label>
          <input
            aria-label="Date submitted"
            type="date"
            value={dateFilter}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none"
          />
        </div>
        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={onFilter}
            className="inline-flex h-[60px] w-[250px] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white"
          >
            <Filter className="size-4" aria-hidden />
            Filter
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-[60px] px-4 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

type BuyerServiceRequestCardsProps = {
  requestIdFilter?: string;
  statusFilter?: string;
  dateFilter?: string;
};

export function BuyerServiceRequestCards({
  requestIdFilter = "",
  statusFilter = "",
  dateFilter = "",
}: BuyerServiceRequestCardsProps) {
  const { serviceRequests, isLoading, isError } = useAppSelector(
    (state) => state.serviceRequest,
  );
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);

  const detailTarget = useMemo(
    () =>
      detailTargetId
        ? serviceRequests.find((request) => request._id === detailTargetId) ?? null
        : null,
    [detailTargetId, serviceRequests],
  );

  const filteredRequests = useMemo(
    () =>
      applyTableFilters(
        serviceRequests,
        requestIdFilter,
        statusFilter,
        dateFilter,
      ),
    [dateFilter, requestIdFilter, serviceRequests, statusFilter],
  );

  if (isLoading && serviceRequests.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <Spinner showLoadingText />
      </div>
    );
  }

  if (isError && serviceRequests.length === 0) {
    return (
      <div className="p-6 text-sm text-red-700">
        Could not load service requests. Refresh the page or try again later.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-[#6B7280]">
              <th className="border-b border-[#EEF2F7] px-4 py-3">Name of engineer</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Service type</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Price</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Description</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">
                Phone number
              </th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Status</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#6B7280]">
                  {serviceRequests.length === 0
                    ? "You have no service requests yet."
                    : "No service requests match the current filters."}
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => {
                const status = tableStatusDisplay(request.status);
                const description = [request.equipmentName, request.serviceDescription]
                  .filter(Boolean)
                  .join(" - ");
                const showMessaging =
                  request.status === ServiceRequestStatus.ACCEPTED ||
                  request.status === ServiceRequestStatus.IN_PROGRESS;

                return (
                  <tr
                    key={request._id}
                    className="text-[#111827] [&>td]:border-b [&>td]:border-[#EEF2F7] [&>td]:py-4"
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-9 shrink-0 rounded-md bg-[#E5E7EB]" />
                        <span className="font-medium">
                          {getPartyName(request.engineer)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4">{request.jobType}</td>
                    <td className="px-4 whitespace-nowrap">
                      {formatCurrency(request.price ?? request.unitPrice)}
                    </td>
                    <td className="max-w-[280px] px-4 text-[#4B5563]">
                      <span className="line-clamp-2">{description}</span>
                    </td>
                    <td className="px-4 whitespace-nowrap">
                      {getPartyPhone(request.engineer)}
                    </td>
                    <td className={`px-4 font-medium ${status.className}`}>
                      {status.label}
                    </td>
                    <td className="px-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setDetailTargetId(request._id)}
                          className="inline-flex items-center gap-1.5 font-semibold text-primary"
                        >
                          <Eye className="size-4" strokeWidth={1.75} aria-hidden />
                          View
                        </button>

                        {showMessaging ? (
                          <Link
                            href="/dashboard/buyer/messages"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Open chat
                            <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        ) : null}

                        {request.disputeActive ? (
                          <span className="text-xs font-semibold text-[#B45309]">
                            Dispute active
                          </span>
                        ) : null}

                        {request.status === ServiceRequestStatus.CLOSED_AFTER_DISPUTE ? (
                          <span className="text-xs text-[#6B7280]">
                            Closed through dispute resolution
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detailTarget ? (
        <ServiceRequestDetailDrawer
          open
          onClose={() => setDetailTargetId(null)}
          request={detailTarget}
        />
      ) : null}
    </>
  );
}
