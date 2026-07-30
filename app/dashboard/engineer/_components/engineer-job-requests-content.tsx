"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  FileText,
  Info,
  MapPin,
  SlidersHorizontal,
  ThumbsUp,
  X,
} from "lucide-react";

import { Button, Spinner } from "@/components/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/base/Dialog";
import {
  useEngineerServiceRequestsQuery,
  useServiceRequestSummaryQuery,
  useUpdateServiceRequestStatusMutation,
} from "@/hooks/queries/service-requests";
import {
  ServiceRequestData,
  ServiceRequestParty,
  ServiceRequestStatus,
} from "@/types/service-request";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";

const PLACEHOLDER_IMAGE = "/images/product.webp";
const FIGMA_EQUIPMENT_IMAGE = "/images/engineer-equipment-figma-mobile.png";

function formatRequestId(id: string): string {
  return `ID: JR-${String(id).slice(-6).toUpperCase()}`;
}

/** Formats a count with a leading zero for single-digit values, matching Figma display style. */
function formatCount(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Mobile-only ID display: strips mock prefixes so "sr-JI23456" renders as "ID: JI23456". */
function formatMobileId(id: string): string {
  const stripped = String(id).replace(/^[a-z]+-/i, "");
  return `ID: ${stripped.toUpperCase()}`;
}

function formatSchedule(preferredDate: string, preferredTime?: string): string {
  const parsed = new Date(preferredDate);
  if (Number.isNaN(parsed.getTime())) {
    return preferredDate;
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
  return preferredTime ? `${datePart} - ${preferredTime}` : datePart;
}

function getRequesterLabel(requester: ServiceRequestData["requester"]): string {
  if (requester && typeof requester === "object") {
    const party = requester as ServiceRequestParty;
    const fullName = [party.firstName, party.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fullName) {
      const businessName =
        party.businessName ||
        party.distributorStoreProfile?.businessName ||
        party.organization;
      const org = businessName ? ` from ${businessName}` : "";
      return `Requested by ${fullName}${org}`;
    }
    if (party.email) {
      return `Requested by ${party.email}`;
    }
  }

  return "Requested by buyer";
}

function getRequesterId(requester: ServiceRequestData["requester"]): string | null {
  if (typeof requester === "string") {
    return requester;
  }

  if (requester && typeof requester === "object") {
    return requester._id || null;
  }

  return null;
}

function statusLabel(status: ServiceRequestStatus): string {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return "Pending";
    case ServiceRequestStatus.ACCEPTED:
      return "Accepted";
    case ServiceRequestStatus.REJECTED:
      return "Rejected";
    case ServiceRequestStatus.IN_PROGRESS:
      return "In progress";
    case ServiceRequestStatus.WORK_COMPLETED:
      return "Awaiting buyer confirmation";
    case ServiceRequestStatus.COMPLETED:
      return "Completed";
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "Closed after dispute";
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  const styles: Record<ServiceRequestStatus, string> = {
    [ServiceRequestStatus.PENDING]:
      "rounded-full bg-[#FFF7F0] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#FE6E00]",
    [ServiceRequestStatus.ACCEPTED]:
      "rounded-full bg-[#DEFFE7] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#13A83B]",
    [ServiceRequestStatus.REJECTED]:
      "rounded-full bg-[#FFE3DD] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#E33C13]",
    [ServiceRequestStatus.IN_PROGRESS]:
      "rounded-full bg-[#E2F1FF] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#017BED]",
    [ServiceRequestStatus.WORK_COMPLETED]:
      "rounded-full bg-[#E2F1FF] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#017BED]",
    [ServiceRequestStatus.COMPLETED]:
      "rounded-full bg-[#DEFFE7] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#13A83B]",
    [ServiceRequestStatus.CLOSED_AFTER_DISPUTE]:
      "rounded-full bg-[#FFF7F0] px-[20px] py-[5px] text-[14px] font-normal leading-[20px] text-[#FE6E00]",
  };

  return (
    <span className={styles[status] ?? styles[ServiceRequestStatus.PENDING]}>
      {statusLabel(status)}
    </span>
  );
}

function JobTypeBadge({ jobType }: { jobType: string }) {
  const safeJobType = jobType?.trim() || "Service";
  const isRepair = safeJobType.toLowerCase().includes("repair");
  return (
    <span
      className={`inline-flex items-center gap-[8px] rounded-full px-[10px] py-[5px] text-[14px] font-normal leading-[20px] ${
        isRepair
          ? "bg-[#FFE3DD] text-[#E33C13]"
          : "bg-[#E2F1FF] text-[#0669D9]"
      }`}
    >
      {safeJobType}
    </span>
  );
}

function countByStatus(
  requests: ServiceRequestData[],
  status: ServiceRequestStatus,
): number {
  return requests.filter((request) => request.status === status).length;
}

type EngineerSummaryMetricCardsProps = {
  requests: ServiceRequestData[];
};

/**
 * Counters come from `GET /service-requests/summary`, which the backend scopes
 * to the signed-in engineer. `requests` is only a fallback for the first paint
 * (or if the summary call fails) and counts the loaded page alone.
 */
export function EngineerSummaryMetricCards({
  requests,
}: EngineerSummaryMetricCardsProps) {
  const { data: summary } = useServiceRequestSummaryQuery();
  const byStatus = summary?.byStatus;

  const total = summary?.total ?? requests.length;
  const pending =
    byStatus?.[ServiceRequestStatus.PENDING] ??
    countByStatus(requests, ServiceRequestStatus.PENDING);
  const completed =
    byStatus?.[ServiceRequestStatus.COMPLETED] ??
    countByStatus(requests, ServiceRequestStatus.COMPLETED);
  const rejected =
    byStatus?.[ServiceRequestStatus.REJECTED] ??
    countByStatus(requests, ServiceRequestStatus.REJECTED);

  const cards = [
    {
      title: "All job requests",
      value: formatCount(total),
      meta: "Review incoming requests and progress",
      accent: "#E5F1FF",
      icon: <FileText className="size-[18px] text-[#2F80ED]" strokeWidth={1.75} />,
    },
    {
      title: "All pending job requests",
      value: formatCount(pending),
      meta: "Awaiting engineer action",
      accent: "#FFF4D8",
      icon: <FileClock className="size-[18px] text-[#D4A017]" strokeWidth={1.75} />,
    },
    {
      title: "Completed job request",
      value: formatCount(completed),
      meta: "Delivered service jobs",
      accent: "#F9E4FF",
      icon: (
        <CheckCircle2 className="size-[18px] text-[#9333EA]" strokeWidth={1.75} />
      ),
    },
    {
      title: "Rejected job requests",
      value: formatCount(rejected),
      meta: "Requests you rejected",
      accent: "#E7F9EC",
      icon: <FileText className="size-[18px] text-[#34A853]" strokeWidth={1.75} />,
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1160px] grid-cols-2 gap-4 md:gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="min-h-[104px] rounded-[16px] border border-[#DDE0E5] bg-white px-[14px] py-[16px] md:min-h-[128px] md:border-[#F3F4F6] md:px-[20px] md:py-[24px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] leading-[16px] text-[#111827] md:text-[14px] md:leading-[20px]">
                {card.title}
              </p>
              <p className="mt-[5px] text-[16px] font-normal leading-[24px] text-[#111827] md:text-[18px] md:font-medium">
                {card.value}
              </p>
            </div>
            <span
              className="inline-flex size-[25px] shrink-0 items-center justify-center rounded-[5px] md:size-11 md:rounded-[8px]"
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

type EngineerJobRequestsPageFilterPanelProps = {
  jobTypeFilter: string;
  statusFilter: string;
  dateFilter: string;
  onJobTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFilter?: () => void;
};

export function EngineerJobRequestsPageFilterPanel({
  jobTypeFilter,
  statusFilter,
  dateFilter,
  onJobTypeChange,
  onStatusChange,
  onDateChange,
  onFilter,
}: EngineerJobRequestsPageFilterPanelProps) {
  return (
    <section
      id="engineer-job-requests"
      className="mx-auto w-full max-w-[1160px] rounded-[10px] border border-[#F3F4F6] bg-white px-[16px] py-[16px] md:px-[20px] md:py-[19px]"
    >
      <h2 className="text-[16px] font-medium leading-[24px] text-[#111827] md:text-[18px]">
        Job Requests
      </h2>
      <div className="mt-[20px] md:mt-[30px]">
        <p className="text-[14px] font-medium leading-[24px] text-[#111827]">
          Filter table list by:
        </p>
      </div>
      <div className="mt-[16px] flex flex-col gap-[16px] md:mt-[20px] md:gap-[20px] lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex flex-col gap-[4px]">
          <span className="px-[16px] text-[16px] leading-[24px] text-[#111827]">
            Job type
          </span>
          <input
            aria-label="Job type filter"
            type="text"
            placeholder="Enter job type"
            value={jobTypeFilter}
            onChange={(event) => onJobTypeChange(event.target.value)}
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-[12px] border border-[#DDE0E5] px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none placeholder:text-[#C4C8CE]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="px-[16px] text-[16px] leading-[24px] text-[#111827]">
            Status
          </span>
          <select
            aria-label="Job status filter"
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-[12px] border border-[#DDE0E5] bg-white px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none"
          >
            <option value="">Select status</option>
            <option value={ServiceRequestStatus.PENDING}>Pending</option>
            <option value={ServiceRequestStatus.ACCEPTED}>Accepted</option>
            <option value={ServiceRequestStatus.REJECTED}>Rejected</option>
            <option value={ServiceRequestStatus.IN_PROGRESS}>In progress</option>
            <option value={ServiceRequestStatus.WORK_COMPLETED}>
              Awaiting buyer confirmation
            </option>
            <option value={ServiceRequestStatus.COMPLETED}>Completed</option>
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="px-[16px] text-[16px] leading-[24px] text-[#111827]">
            Date
          </span>
          <input
            aria-label="Date filter"
            type="date"
            value={dateFilter}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11 w-full lg:h-[60px] lg:w-[250px] rounded-[12px] border border-[#DDE0E5] px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none placeholder:text-[#C4C8CE]"
          />
        </label>
        <button
          type="button"
          onClick={onFilter}
          className="inline-flex h-11 w-full lg:mt-[28px] lg:h-[60px] lg:w-[250px] items-center justify-center gap-[8px] rounded-[12px] bg-primary text-[16px] font-normal leading-[24px] text-white"
        >
          <SlidersHorizontal className="size-6" aria-hidden />
          Filter
        </button>
      </div>
    </section>
  );
}

type EngineerJobCardsProps = {
  maxItems?: number;
  jobTypeFilter?: string;
  statusFilter?: string;
  dateFilter?: string;
};

/** Tabs mirror the Figma order; "" is the all-requests tab. */
const TABS: ReadonlyArray<{ value: ServiceRequestStatus | ""; label: string }> = [
  { value: "", label: "All Request" },
  { value: ServiceRequestStatus.PENDING, label: "Pending Request" },
  { value: ServiceRequestStatus.ACCEPTED, label: "Accepted Request" },
  { value: ServiceRequestStatus.REJECTED, label: "Rejected Request" },
  { value: ServiceRequestStatus.COMPLETED, label: "Completed Request" },
];

const FIGMA_STATUS_ORDER: Partial<Record<ServiceRequestStatus, number>> = {
  [ServiceRequestStatus.ACCEPTED]: 0,
  [ServiceRequestStatus.PENDING]: 1,
  [ServiceRequestStatus.REJECTED]: 2,
};

function sortByFigmaStatusOrder(
  requests: ServiceRequestData[],
): ServiceRequestData[] {
  return [...requests].sort((left, right) => {
    const leftStatusOrder = FIGMA_STATUS_ORDER[left.status] ?? 99;
    const rightStatusOrder = FIGMA_STATUS_ORDER[right.status] ?? 99;

    if (leftStatusOrder !== rightStatusOrder) {
      return leftStatusOrder - rightStatusOrder;
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

/** Explains why a card has no engineer-side action left, or null when it has one. */
function getStatusNote(
  status: ServiceRequestStatus,
  disputeActive: boolean,
): string | null {
  if (disputeActive && status !== ServiceRequestStatus.CLOSED_AFTER_DISPUTE) {
    return "A dispute is open on this job. Actions are paused until it is resolved.";
  }

  switch (status) {
    case ServiceRequestStatus.WORK_COMPLETED:
      return "You marked the work as finished. The buyer confirms it from their end.";
    case ServiceRequestStatus.REJECTED:
      return "You rejected this request. No further action is available.";
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "This job was closed after dispute resolution.";
    case ServiceRequestStatus.COMPLETED:
      return "This job is completed.";
    default:
      return null;
  }
}

/**
 * The one status transition the engineer may make from the current state, or
 * null when the next move belongs to the buyer. Mirrors the backend's
 * `ALLOWED_TRANSITIONS`: accepted -> in_progress -> work_completed, after which
 * the buyer confirms via `PATCH /:id/buyer-complete`.
 */
function getNextEngineerStatus(
  request: ServiceRequestData,
): ServiceRequestStatus | null {
  if (request.disputeActive) {
    return null;
  }

  switch (request.status) {
    case ServiceRequestStatus.ACCEPTED:
      return ServiceRequestStatus.IN_PROGRESS;
    case ServiceRequestStatus.IN_PROGRESS:
      return ServiceRequestStatus.WORK_COMPLETED;
    default:
      return null;
  }
}

const STATUS_UPDATE_COPY: Record<
  string,
  { cta: string; hint: string; currentHint: string }
> = {
  [ServiceRequestStatus.IN_PROGRESS]: {
    cta: "Mark as In Progress",
    hint: "Move this request to in-progress once you have started the work.",
    currentHint: "You accepted this request on",
  },
  [ServiceRequestStatus.WORK_COMPLETED]: {
    cta: "Mark as Completed",
    hint: "The buyer confirms completion on their end once you mark the work as finished.",
    currentHint: "You started this job on",
  },
};

function requestImageSrc(request: ServiceRequestData): string {
  return request.photos?.[0]?.url?.trim() || FIGMA_EQUIPMENT_IMAGE || PLACEHOLDER_IMAGE;
}

function ServiceRequestImage({
  request,
  className,
}: {
  request: ServiceRequestData;
  className: string;
}) {
  return (
    <Image
      src={requestImageSrc(request)}
      alt={request.equipmentName}
      width={296}
      height={296}
      unoptimized
      className={className}
      onError={(event) => {
        event.currentTarget.src = FIGMA_EQUIPMENT_IMAGE;
      }}
    />
  );
}

function RequestDetailRows({ request }: { request: ServiceRequestData }) {
  return (
    <div className="flex flex-col gap-[10px] text-black">
      {request.serviceLocation ? (
        <p className="flex items-start gap-[6px] text-[14px] leading-[20px] md:text-[16px] md:leading-[24px]">
          <MapPin
            className="mt-[2px] size-5 shrink-0 text-[#4B5563]"
            strokeWidth={1.5}
          />
          <span className="min-w-0 flex-1 break-words">
            {request.serviceLocation}
          </span>
        </p>
      ) : null}
      <p className="flex items-start gap-[6px] text-[14px] leading-[20px] md:text-[16px] md:leading-[24px]">
        <Clock3
          className="mt-[2px] size-5 shrink-0 text-[#4B5563]"
          strokeWidth={1.5}
        />
        <span className="min-w-0 flex-1 break-words">
          {formatSchedule(request.preferredDate, request.preferredTime)}
        </span>
      </p>
      <p className="flex items-start gap-[6px] text-[14px] leading-[20px] md:text-[16px] md:leading-[24px]">
        <Info
          className="mt-[2px] size-5 shrink-0 text-[#4B5563]"
          strokeWidth={1.5}
        />
        <span className="min-w-0 flex-1 break-words">
          {request.serviceDescription}
        </span>
      </p>
    </div>
  );
}

function DialogDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-[12px] py-[14px]">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF3FE] text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[13px] leading-[18px] text-[#6B7280]">{label}</dt>
        <dd className="mt-[2px] break-words text-[15px] leading-[22px] text-[#111827]">
          {value}
        </dd>
      </div>
    </div>
  );
}

function StatusUpdateDialog({
  open,
  request,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  request: ServiceRequestData | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const nextStatus = request ? getNextEngineerStatus(request) : null;
  const copy = nextStatus ? STATUS_UPDATE_COPY[nextStatus] : null;

  if (!request || !copy) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!left-0 !top-0 !h-screen !max-h-none !w-full !max-w-none !translate-x-0 !translate-y-0 overflow-y-auto rounded-none border-0 bg-white p-0 md:!left-[50%] md:!top-[50%] md:!h-auto md:!max-h-[calc(100vh-32px)] md:!w-[430px] md:!max-w-[430px] md:!translate-x-[-50%] md:!translate-y-[-50%] md:rounded-[4px]"
      >
        <DialogHeader className="hidden">
          <DialogTitle>Update Job Status</DialogTitle>
          <DialogDescription>{copy.hint}</DialogDescription>
        </DialogHeader>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#EEF0F3] px-[20px] py-[18px] md:px-[24px]">
            <h2 className="text-[18px] font-medium leading-[26px] text-[#111827]">
              Update Job Status
            </h2>
            <button
              type="button"
              aria-label="Close update job status"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-[16px] py-[20px] md:px-[20px]">
            <div className="rounded-[12px] border border-[#E5E7EB] p-[16px] md:p-[20px]">
              <div className="flex gap-[16px]">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-medium leading-[26px] text-black">
                    {request.equipmentName}
                  </h3>
                  {request.model ? (
                    <p className="mt-[2px] text-[14px] leading-[20px] text-[#6B7280]">
                      Model: {request.model}
                    </p>
                  ) : null}
                  <div className="mt-[12px] flex flex-wrap gap-[8px]">
                    <JobTypeBadge jobType={request.jobType} />
                    <StatusBadge status={request.status} />
                  </div>
                </div>
                <div className="hidden size-[80px] shrink-0 overflow-hidden rounded-[8px] border border-[#DDE0E5] sm:block">
                  <ServiceRequestImage
                    request={request}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <dl className="mt-[20px] divide-y divide-[#EEF0F3]">
                {request.serviceLocation ? (
                  <DialogDetailRow
                    icon={<MapPin className="size-5" strokeWidth={1.8} aria-hidden />}
                    label="Service location"
                    value={request.serviceLocation}
                  />
                ) : null}
                <DialogDetailRow
                  icon={<CalendarDays className="size-5" strokeWidth={1.8} aria-hidden />}
                  label="Scheduled for"
                  value={formatSchedule(request.preferredDate, request.preferredTime)}
                />
                <DialogDetailRow
                  icon={<Info className="size-5" strokeWidth={1.8} aria-hidden />}
                  label="Service description"
                  value={request.serviceDescription}
                />
              </dl>

              <div className="mt-[20px] flex items-start gap-[12px] rounded-[10px] bg-[#EEF3FE] p-[16px]">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-white text-primary">
                  <FileText className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-[18px] text-[#6B7280]">
                    Current Status
                  </p>
                  <p className="text-[16px] font-medium leading-[24px] text-[#111827]">
                    {statusLabel(request.status)}
                  </p>
                  <p className="mt-[2px] text-[13px] leading-[18px] text-[#6B7280]">
                    {copy.currentHint} {formatSchedule(request.updatedAt)}
                  </p>
                </div>
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DEFFE7] text-[#13A83B]">
                  <CheckCircle2 className="size-5" strokeWidth={2} aria-hidden />
                </span>
              </div>

              <Button
                type="button"
                disabled={busy}
                isBusy={busy}
                onClick={onConfirm}
                iconLeft={<CheckCircle2 className="size-5" aria-hidden />}
                className="mt-[20px] h-12 w-full rounded-[8px] border-0 px-5 text-[16px] font-normal leading-[24px] md:h-[56px]"
              >
                {copy.cta}
              </Button>
              <p className="mt-[10px] text-center text-[13px] leading-[18px] text-[#6B7280]">
                {copy.hint}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusResultDialog({
  open,
  type,
  onClose,
  onRetry,
}: {
  open: boolean;
  type: "success" | "error";
  onClose: () => void;
  onRetry?: () => void;
}) {
  const isSuccess = type === "success";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-48px)] max-w-[320px] rounded-[16px] border border-[#DDE0E5] bg-white p-0"
      >
        <DialogHeader className="hidden">
          <DialogTitle>{isSuccess ? "Congratulations" : "Status Update Failed"}</DialogTitle>
          <DialogDescription>
            {isSuccess ? "Job status updated" : "Click here to try again"}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex min-h-[190px] flex-col items-center justify-center px-[24px] py-[24px] text-center">
            <ThumbsUp
              className="size-[32px] text-[#13A83B]"
              strokeWidth={1.7}
              aria-hidden
            />
            <h3 className="mt-[18px] text-[14px] font-medium leading-[24px] text-[#13A83B]">
              Congratulations
            </h3>
            <p className="mt-[6px] text-[12px] font-normal leading-[18px] text-[#111827]">
              Job status updated
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-[24px] h-[44px] w-[130px] rounded-[8px] bg-primary text-[14px] font-medium leading-[20px] text-white"
            >
              Okay
            </button>
          </div>
        ) : (
          <div className="px-[24px] py-[24px]">
            <div className="rounded-[8px] border border-[#FFE7D4] bg-[#FFF7F0] px-[18px] py-[18px]">
              <AlertCircle
                className="size-[20px] text-[#FE6E00]"
                strokeWidth={1.8}
                aria-hidden
              />
              <h3 className="mt-[12px] text-[12px] font-medium leading-[18px] text-[#111827]">
                Status Update Failed
              </h3>
              <button
                type="button"
                onClick={onRetry}
                className="mt-[6px] text-left text-[12px] font-medium leading-[18px] text-[#FE6E00]"
              >
                Click here to try again
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-[28px] h-[44px] w-full rounded-[8px] border border-primary bg-[#EAF9FF] text-[14px] font-medium leading-[20px] text-[#111827]"
            >
              Cancel
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function applyClientFilters(
  requests: ServiceRequestData[],
  jobTypeFilter?: string,
  statusFilter?: string,
  dateFilter?: string,
): ServiceRequestData[] {
  let list = [...requests].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  const normalizedJobType = jobTypeFilter?.trim().toLowerCase();
  if (normalizedJobType) {
    list = list.filter((request) =>
      request.jobType.toLowerCase().includes(normalizedJobType),
    );
  }

  if (statusFilter) {
    list = list.filter((request) => request.status === statusFilter);
  }

  if (dateFilter) {
    list = list.filter(
      (request) => request.preferredDate.slice(0, 10) === dateFilter,
    );
  }

  return list;
}

export function EngineerJobCards({
  maxItems,
  jobTypeFilter = "",
  statusFilter = "",
  dateFilter = "",
}: EngineerJobCardsProps) {
  const { data, isPending: isLoading, isError } = useEngineerServiceRequestsQuery();
  const serviceRequests = useMemo(() => data?.requests ?? [], [data]);
  const updateStatusMutation = useUpdateServiceRequestStatusMutation();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // null == untouched, so the filter panel's status drives the tabs until the
  // user picks a tab explicitly; after that the tab wins.
  const [tabStatus, setTabStatus] = useState<ServiceRequestStatus | "" | null>(
    null,
  );
  const [statusDialogRequest, setStatusDialogRequest] =
    useState<ServiceRequestData | null>(null);
  const [failedStatusRequest, setFailedStatusRequest] =
    useState<ServiceRequestData | null>(null);
  const [statusResult, setStatusResult] = useState<"success" | "error" | null>(
    null,
  );
  const showTabs = typeof maxItems !== "number";
  const effectiveStatusFilter = tabStatus ?? statusFilter;

  const filtered = useMemo(
    () =>
      applyClientFilters(
        serviceRequests,
        jobTypeFilter,
        effectiveStatusFilter,
        dateFilter,
      ),
    [dateFilter, effectiveStatusFilter, jobTypeFilter, serviceRequests],
  );

  const visible = useMemo(() => {
    if (typeof maxItems === "number") {
      return filtered.slice(0, maxItems);
    }

    return sortByFigmaStatusOrder(filtered);
  }, [filtered, maxItems]);

  const updateStatus = async (
    request: ServiceRequestData,
    status: ServiceRequestStatus,
    options?: { showResult?: boolean },
  ): Promise<boolean> => {
    setActionError(null);
    setUpdatingId(request._id);

    try {
      await updateStatusMutation.mutateAsync({
        id: request._id,
        payload: { status },
      });
      if (options?.showResult) {
        setFailedStatusRequest(null);
        setStatusDialogRequest(null);
        setStatusResult("success");
      }
      return true;
    } catch (error) {
      if (!options?.showResult) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Could not update job status. Try again.",
        );
      }
      if (options?.showResult) {
        setFailedStatusRequest(request);
        setStatusDialogRequest(null);
        setStatusResult("error");
      }
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmStatusAdvance = (request: ServiceRequestData | null) => {
    const nextStatus = request ? getNextEngineerStatus(request) : null;
    if (!request || !nextStatus) {
      return;
    }

    void updateStatus(request, nextStatus, { showResult: true });
  };

  if (isLoading && serviceRequests.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-[#E6ECF2] bg-white p-8">
        <Spinner showLoadingText />
      </div>
    );
  }

  if (isError && serviceRequests.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 text-sm text-red-700">
        Could not load job requests. Refresh the page or try again later.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] space-y-[16px]">
      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}

      {showTabs ? (
        <div
          role="tablist"
          aria-label="Filter job requests by status"
          className="-mx-4 flex gap-[10px] overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-[16px] md:overflow-visible md:px-0"
        >
          {TABS.map((tab) => {
            const active = effectiveStatusFilter === tab.value;
            return (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTabStatus(tab.value)}
                className={`flex h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] px-[18px] text-[14px] font-normal leading-[20px] transition-colors md:h-[60px] md:flex-1 md:rounded-[14px] md:px-[12px] md:text-[16px] md:leading-[24px] lg:text-[18px] ${
                  active
                    ? "bg-[#C4C8CE] text-[#111827]"
                    : "border border-[#C4C8CE] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#EAECEF]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-[10px] border border-[#F3F4F6] bg-white p-8 text-center text-sm text-[#6B7280]">
          {serviceRequests.length === 0
            ? "You have no job requests yet."
            : "No job requests match the current filters."}
        </div>
      ) : null}

      {visible.map((request) => {
        const busy = updatingId === request._id;
        const hasActiveDispute = request.disputeActive;
        const requesterChatHref = buildMessagingComposeHref(
          "engineer",
          getRequesterId(request.requester),
        );

        // An open dispute freezes engineer-side transitions; chat stays available
        // so the parties can still resolve it.
        const canAcceptOrReject =
          request.status === ServiceRequestStatus.PENDING && !hasActiveDispute;
        const canUpdateStatus = getNextEngineerStatus(request) !== null;
        const showChatCta =
          request.status === ServiceRequestStatus.ACCEPTED ||
          request.status === ServiceRequestStatus.IN_PROGRESS ||
          request.status === ServiceRequestStatus.WORK_COMPLETED ||
          request.status === ServiceRequestStatus.COMPLETED;
        const statusNote = getStatusNote(request.status, hasActiveDispute);

        return (
          <article
            key={request._id}
            className="overflow-hidden rounded-[10px] border border-[#F3F4F6] bg-white p-[16px] md:p-[20px]"
          >
            {/* Badges + heading + details on the left, equipment photo on the right. */}
            <div className="flex flex-col gap-[16px] md:flex-row md:items-start md:gap-[20px]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[8px]">
                  <JobTypeBadge jobType={request.jobType} />
                  <StatusBadge status={request.status} />
                </div>

                <h3 className="mt-[12px] text-[16px] font-medium leading-[28px] text-black md:mt-[16px] md:text-[20px] md:leading-[32px]">
                  {request.equipmentName}
                  <span className="text-[#6B7280]">
                    {/* Full JR- id has room on desktop; mobile shows the short form. */}
                    <span className="md:hidden">
                      {" "}
                      | {formatMobileId(request._id)}
                    </span>
                    <span className="hidden md:inline">
                      {" "}
                      | {formatRequestId(request._id)}
                    </span>
                  </span>
                </h3>

                {request.model ? (
                  <p className="mt-[3px] text-[14px] font-medium leading-[24px] text-[#6B7280]">
                    Model:&nbsp;{request.model}
                  </p>
                ) : null}

                <div className="mt-[16px] md:mt-[18px]">
                  <RequestDetailRows request={request} />
                </div>
              </div>

              <div className="order-first h-[200px] w-full shrink-0 overflow-hidden rounded-[14px] border border-[#DDE0E5] sm:h-[240px] md:order-none md:size-[182px]">
                <ServiceRequestImage
                  request={request}
                  className="h-full w-full object-contain md:object-cover"
                />
              </div>
            </div>

            <div className="mt-[20px] border-t border-[#DDE0E5] pt-[8px]">
              <p className="text-[14px] font-normal leading-[20px] text-[#6B7280]">
                {getRequesterLabel(request.requester)}
              </p>
            </div>

            <div className="mt-[20px] flex flex-col items-stretch gap-[12px] md:flex-row md:items-center md:gap-[16px]">
              {canAcceptOrReject ? (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    isBusy={busy}
                    onClick={() => void updateStatus(request, ServiceRequestStatus.ACCEPTED)}
                    className="h-12 w-full rounded-[14px] border-0 px-5 text-[16px] font-normal leading-[24px] md:h-[60px] md:w-[320px] md:text-[18px] md:leading-[32px]"
                  >
                    Accept
                  </Button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(request, ServiceRequestStatus.REJECTED)}
                    className="inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-[#FE6E00] bg-[#FFF7F0] px-5 text-[16px] font-normal leading-[24px] text-[#FE6E00] disabled:opacity-60 md:h-[60px] md:w-[320px] md:text-[18px] md:leading-[32px]"
                  >
                    Reject
                  </button>
                </>
              ) : null}

              {/* Figma: Open chat is the primary CTA once a job leaves the pending state. */}
              {showChatCta && requesterChatHref ? (
                <Link
                  href={requesterChatHref}
                  className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-primary px-5 text-[16px] font-normal leading-[24px] text-white md:h-[60px] md:w-[486px] md:text-[18px] md:leading-[32px]"
                >
                  Open chat
                </Link>
              ) : null}

              {canUpdateStatus ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatusDialogRequest(request)}
                  className="inline-flex h-12 w-full items-center justify-center gap-[8px] rounded-[14px] border border-primary bg-[#F3F9FF] px-5 text-[16px] font-normal leading-[24px] text-primary disabled:opacity-50 md:h-[60px] md:w-auto md:min-w-[220px] md:text-[18px] md:leading-[32px]"
                >
                  Update Job Status
                  <ArrowRight className="size-5 md:size-6" aria-hidden />
                </button>
              ) : null}

              {statusNote ? (
                <p className="text-[13px] leading-[20px] text-[#6B7280] md:text-sm">
                  {statusNote}
                </p>
              ) : null}
            </div>
          </article>
        );
      })}

      <StatusUpdateDialog
        open={Boolean(statusDialogRequest)}
        request={statusDialogRequest}
        busy={Boolean(
          statusDialogRequest && updatingId === statusDialogRequest._id,
        )}
        onClose={() => setStatusDialogRequest(null)}
        onConfirm={() => confirmStatusAdvance(statusDialogRequest)}
      />

      <StatusResultDialog
        open={statusResult === "success"}
        type="success"
        onClose={() => setStatusResult(null)}
      />

      <StatusResultDialog
        open={statusResult === "error"}
        type="error"
        onClose={() => setStatusResult(null)}
        onRetry={() => {
          setStatusResult(null);
          confirmStatusAdvance(failedStatusRequest);
        }}
      />
    </div>
  );
}

export function EngineerDashboardJobSection() {
  return (
    <>
      {/* Section heading: desktop only; Figma mobile goes straight to job cards. */}
      <section className="hidden md:block mt-4 rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#111827]">
              Recent Job Requests
            </h2>
            <p className="text-sm text-[#6B7280]">
              Latest activity on your account
            </p>
          </div>
          <Link
            href="/dashboard/engineer/job-requests"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            See All
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="mt-5 md:mt-4">
        <EngineerJobCards maxItems={2} />
      </section>
    </>
  );
}
