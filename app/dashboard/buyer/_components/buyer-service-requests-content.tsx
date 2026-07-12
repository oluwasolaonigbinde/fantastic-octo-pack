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
import { useBuyerServiceRequestsQuery } from "@/hooks/queries/service-requests";
import {
  ServiceRequestData,
  ServiceRequestStatus,
} from "@/types/service-request";

import { OverviewSectionHeading } from "../../component/overview-primitives";
import ServiceRequestDetailPanel from "./service-request-detail-panel";

function formatRequestId(id: string): string {
  const tail = String(id).slice(-6).toUpperCase();
  return `JR-${tail}`;
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** e.g. "20th May, 2024" */
function formatLongDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = parsed.getDate();
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(parsed);
  return `${day}${ordinalSuffix(day)} ${month}, ${parsed.getFullYear()}`;
}

/** e.g. "10:30 AM" */
function formatTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
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

function tableStatusDisplay(status: ServiceRequestStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return { label: "Pending", className: "text-[#D89A2D]" };
    case ServiceRequestStatus.ACCEPTED:
      return { label: "Accepted", className: "text-[#34A853]" };
    case ServiceRequestStatus.IN_PROGRESS:
      return { label: "In progress", className: "text-[#D97627]" };
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
  const { data } = useBuyerServiceRequestsQuery();
  const serviceRequests = data?.requests ?? [];

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#C4C8CE]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111827]">Status badge</label>
          <select
            aria-label="Status filter"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm text-[#111827] outline-none"
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
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none"
          />
        </div>
        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={onFilter}
            className="inline-flex h-11 w-full lg:h-[60px] lg:w-[250px] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white"
          >
            <Filter className="size-4" aria-hidden />
            Filter
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-11 lg:h-[60px] px-4 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
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
  const { data, isPending: isLoading, isError } = useBuyerServiceRequestsQuery();
  const serviceRequests = data?.requests ?? [];
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

  if (detailTarget) {
    return (
      <ServiceRequestDetailPanel
        onClose={() => setDetailTargetId(null)}
        request={detailTarget}
      />
    );
  }

  const isEmpty = filteredRequests.length === 0;
  const emptyMessage =
    serviceRequests.length === 0
      ? "You have no service requests yet."
      : "No service requests match the current filters.";

  const renderAction = (request: ServiceRequestData) => {
    const canContact =
      request.status === ServiceRequestStatus.ACCEPTED ||
      request.status === ServiceRequestStatus.IN_PROGRESS;

    if (canContact) {
      return (
        <Link
          href="/dashboard/buyer/messages"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center justify-center rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          Contact Engineer
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDetailTargetId(request._id);
        }}
        className="inline-flex items-center gap-1.5 font-semibold text-primary"
      >
        <Eye className="size-4" strokeWidth={1.75} aria-hidden />
        View
      </button>
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[820px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-[#6B7280]">
              <th className="border-b border-[#EEF2F7] px-4 py-3">Name of engineer</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Equipment</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Service Type</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Date</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Status</th>
              <th className="border-b border-[#EEF2F7] px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#6B7280]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => {
                const status = tableStatusDisplay(request.status);

                return (
                  <tr
                    key={request._id}
                    onClick={() => setDetailTargetId(request._id)}
                    className="cursor-pointer text-[#111827] [&>td]:border-b [&>td]:border-[#EEF2F7] [&>td]:py-4"
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-9 shrink-0 rounded-full bg-[#E5E7EB]" />
                        <span className="font-medium whitespace-nowrap">
                          {getPartyName(request.engineer)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 whitespace-nowrap">{request.equipmentName || "--"}</td>
                    <td className="px-4 whitespace-nowrap">{request.jobType}</td>
                    <td className="px-4 whitespace-nowrap">
                      <span className="font-medium">{formatLongDate(request.createdAt)}</span>
                      <span className="ml-2 text-xs text-[#9CA3AF]">
                        {formatTime(request.createdAt)}
                      </span>
                    </td>
                    <td className={`px-4 font-medium whitespace-nowrap ${status.className}`}>
                      {status.label}
                    </td>
                    <td className="px-4">{renderAction(request)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {isEmpty ? (
          <p className="py-10 text-center text-sm text-[#6B7280]">{emptyMessage}</p>
        ) : (
          filteredRequests.map((request) => {
            const status = tableStatusDisplay(request.status);

            return (
              <button
                key={request._id}
                type="button"
                onClick={() => setDetailTargetId(request._id)}
                className="w-full rounded-2xl border border-[#EEF2F7] p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 rounded-full bg-[#E5E7EB]" />
                    <span className="font-medium text-[#111827]">
                      {getPartyName(request.engineer)}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-[#9CA3AF]">Equipment</dt>
                    <dd className="text-[#111827]">{request.equipmentName || "--"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#9CA3AF]">Service Type</dt>
                    <dd className="text-[#111827]">{request.jobType}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-[#9CA3AF]">Date</dt>
                    <dd className="text-[#111827]">
                      {formatLongDate(request.createdAt)}
                      <span className="ml-2 text-xs text-[#9CA3AF]">
                        {formatTime(request.createdAt)}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end" onClick={(event) => event.stopPropagation()}>
                  {renderAction(request)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
