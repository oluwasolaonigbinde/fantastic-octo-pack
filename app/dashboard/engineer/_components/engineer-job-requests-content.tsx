"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
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
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updateServiceRequestStatus } from "@/store/slices/service-request-slice";
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

export function EngineerSummaryMetricCards({
  requests,
}: EngineerSummaryMetricCardsProps) {
  const statusCounts = useAppSelector((s) => s.serviceRequest.statusCounts);

  const total = statusCounts?.total ?? requests.length;
  const pending = statusCounts?.pending ?? countByStatus(requests, ServiceRequestStatus.PENDING);
  const completed = statusCounts?.completed ?? countByStatus(requests, ServiceRequestStatus.COMPLETED);
  const rejected = statusCounts?.rejected ?? countByStatus(requests, ServiceRequestStatus.REJECTED);

  const cards = [
    {
      title: "All job requests",
      value: formatCount(total),
      meta: "Review incoming requests and progress",
      accent: "#E5F1FF",
      icon: <FileText className="size-[18px] text-[#2F80ED]" strokeWidth={1.75} />,
    },
    {
      title: "All pending requests",
      value: formatCount(pending),
      meta: "Awaiting engineer action",
      accent: "#FFF4D8",
      icon: <FileClock className="size-[18px] text-[#D4A017]" strokeWidth={1.75} />,
    },
    {
      title: "Completed job requests",
      value: formatCount(completed),
      meta: "Delivered service jobs",
      accent: "#F9E4FF",
      icon: (
        <CheckCircle2 className="size-[18px] text-[#9333EA]" strokeWidth={1.75} />
      ),
    },
    {
      title: "Rejected requests",
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
          className="h-[128px] rounded-[16px] border border-[#DDE0E5] bg-white px-[14px] py-[20px] md:border-[#F3F4F6] md:px-[20px] md:py-[24px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="max-w-[100px] text-[10px] leading-[20px] text-[#111827] md:max-w-none md:text-[14px]">
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
      className="mx-auto hidden h-[245px] w-full max-w-[1160px] rounded-[10px] border border-[#F3F4F6] bg-white px-[20px] py-[19px] md:block"
    >
      <h2 className="text-[18px] font-medium leading-[24px] text-[#111827]">
        Job Requests
      </h2>
      <div className="mt-[30px]">
        <p className="text-[14px] font-medium leading-[24px] text-[#111827]">
          Filter table list by:
        </p>
      </div>
      <div className="mt-[20px] flex gap-[20px]">
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
            className="h-[60px] w-[250px] rounded-[12px] border border-[#DDE0E5] px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none placeholder:text-[#C4C8CE]"
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
            className="h-[60px] w-[250px] rounded-[12px] border border-[#DDE0E5] bg-white px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none"
          >
            <option value="">Select status</option>
            <option value={ServiceRequestStatus.PENDING}>Pending</option>
            <option value={ServiceRequestStatus.ACCEPTED}>Accepted</option>
            <option value={ServiceRequestStatus.REJECTED}>Rejected</option>
            <option value={ServiceRequestStatus.IN_PROGRESS}>In progress</option>
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
            className="h-[60px] w-[250px] rounded-[12px] border border-[#DDE0E5] px-[16px] text-[16px] leading-[24px] text-[#111827] outline-none placeholder:text-[#C4C8CE]"
          />
        </label>
        <button
          type="button"
          onClick={onFilter}
          className="mt-[28px] inline-flex h-[60px] w-[250px] items-center justify-center gap-[8px] rounded-[12px] bg-primary text-[16px] font-normal leading-[24px] text-white"
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

const TAB_STATUSES = [
  ServiceRequestStatus.ACCEPTED,
  ServiceRequestStatus.PENDING,
  ServiceRequestStatus.REJECTED,
] as const;

function tabLabel(status: (typeof TAB_STATUSES)[number]): string {
  switch (status) {
    case ServiceRequestStatus.ACCEPTED:
      return "Accepted Request";
    case ServiceRequestStatus.PENDING:
      return "Pending Request";
    case ServiceRequestStatus.REJECTED:
      return "Rejected Request";
  }
}

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

function RequestDetailRows({
  request,
  nowrapOnDesktop = true,
}: {
  request: ServiceRequestData;
  nowrapOnDesktop?: boolean;
}) {
  const textWrapClass = nowrapOnDesktop ? "md:whitespace-nowrap" : "";

  return (
    <div className="flex flex-col gap-[10px] text-black">
      {request.serviceLocation ? (
        <p className="flex items-start gap-[6px] text-[14px] leading-[20px] md:text-[16px] md:leading-[24px]">
          <MapPin
            className="mt-[2px] size-5 shrink-0 text-[#4B5563]"
            strokeWidth={1.5}
          />
          <span className={`min-w-0 flex-1 break-words ${textWrapClass}`}>
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
        <span className={`min-w-0 flex-1 break-words ${textWrapClass}`}>
          {request.serviceDescription}
        </span>
      </p>
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
  if (!request) {
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
          <DialogDescription>Mark this service request as in progress.</DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-[320px] max-w-full px-[12px] pb-[20px] pt-[24px] md:w-auto md:px-[20px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-medium leading-[20px] text-[#111827]">
              Update Job Status
            </h2>
            <button
              type="button"
              aria-label="Close update job status"
              onClick={onClose}
              className="inline-flex size-6 items-center justify-center text-[#111827]"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="mt-[32px] flex h-[66px] items-center justify-between rounded-[8px] border border-[#13A83B] bg-[#DEFFE7] px-[12px]">
            <p className="text-[14px] font-normal leading-[20px] text-[#111827]">
              Request Status
            </p>
            <span className="inline-flex items-center gap-[8px] rounded-[4px] bg-[#13A83B] px-[14px] py-[8px] text-[12px] font-medium leading-[18px] text-white">
              <CheckCircle2 className="size-3" aria-hidden />
              Accepted
            </span>
          </div>

          <div className="mt-[28px] md:hidden">
            <div className="h-[296px] w-full overflow-hidden rounded-[14.345px] border border-[#DDE0E5]">
              <ServiceRequestImage
                request={request}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-[28px] hidden gap-[16px] md:flex">
            <div className="h-[80px] w-[100px] shrink-0 overflow-hidden rounded-[8px] border border-[#DDE0E5]">
              <ServiceRequestImage
                request={request}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-medium leading-[28px] text-black">
                {request.equipmentName}
              </h3>
              {request.model ? (
                <p className="mt-[3px] text-[14px] font-medium leading-[24px] text-[#6B7280]">
                  Model: {request.model}
                </p>
              ) : null}
              <div className="mt-[8px] flex flex-wrap gap-[8px]">
                <JobTypeBadge jobType={request.jobType} />
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>

          <div className="mt-[16px] md:mt-[20px]">
            <h3 className="text-[14px] font-medium leading-[24px] text-black md:hidden">
              {request.equipmentName}
            </h3>
            {request.model ? (
              <p className="mt-[2px] text-[12px] font-medium leading-[20px] text-[#6B7280] md:hidden">
                Model {request.model}
              </p>
            ) : null}
            <div className="mt-[12px]">
              <RequestDetailRows request={request} nowrapOnDesktop={false} />
            </div>
          </div>

          <Button
            type="button"
            disabled={busy}
            isBusy={busy}
            onClick={onConfirm}
            className="mt-[20px] h-[60px] w-full rounded-[8px] border-0 bg-[#FE6E00] px-5 text-[16px] font-normal leading-[24px] hover:bg-[#E86200]"
          >
            Mark as In progress
          </Button>
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
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const { serviceRequests, isLoading, isError } = useAppSelector(
    (state) => state.serviceRequest,
  );

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tabStatus, setTabStatus] = useState<ServiceRequestStatus | "">("");
  const [statusDialogRequest, setStatusDialogRequest] =
    useState<ServiceRequestData | null>(null);
  const [failedStatusRequest, setFailedStatusRequest] =
    useState<ServiceRequestData | null>(null);
  const [statusResult, setStatusResult] = useState<"success" | "error" | null>(
    null,
  );
  const showTabs = typeof maxItems !== "number";
  const effectiveStatusFilter = statusFilter || tabStatus;

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
    if (!token) {
      if (!options?.showResult) {
        setActionError("You must be signed in to update a job.");
      }
      if (options?.showResult) {
        setStatusResult("error");
      }
      return false;
    }

    setActionError(null);
    setUpdatingId(request._id);

    try {
      await dispatch(
        updateServiceRequestStatus({
          token,
          id: request._id,
          payload: {
            status,
          },
        }),
      ).unwrap();
      if (options?.showResult) {
        setFailedStatusRequest(null);
        setStatusDialogRequest(null);
        setStatusResult("success");
      }
      return true;
    } catch (error) {
      if (!options?.showResult) {
        setActionError(
          typeof error === "string"
            ? error
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

  const confirmInProgress = () => {
    if (!statusDialogRequest) {
      return;
    }

    void updateStatus(statusDialogRequest, ServiceRequestStatus.IN_PROGRESS, {
      showResult: true,
    });
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
        <div className="hidden w-[958px] gap-[16px] md:flex">
          {TAB_STATUSES.map((status) => {
            const active =
              (effectiveStatusFilter || ServiceRequestStatus.ACCEPTED) === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setTabStatus((current) => (current === status ? "" : status))
                }
                className={`flex h-[60px] flex-1 items-center justify-center rounded-[14px] py-[16px] text-[18px] font-normal leading-[32px] ${
                  active
                    ? "bg-[#C4C8CE] text-[#111827]"
                    : "border border-[#C4C8CE] bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {tabLabel(status)}
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

        return (
          <article
            key={request._id}
            className={`relative overflow-hidden rounded-[10px] border border-[#F3F4F6] bg-white md:h-[445px] ${
              request.status === ServiceRequestStatus.PENDING
                ? "min-h-[850px] md:min-h-0"
                : "min-h-[822px] md:min-h-0"
            }`}
          >
            <div>
              {/* Image: top on mobile, right on desktop. */}
              <div className="absolute left-[11px] top-[15px] h-[296px] w-[296px] overflow-hidden rounded-[14.345px] border border-[#DDE0E5] md:left-auto md:right-[20px] md:top-[19px] md:size-[182px]">
                <ServiceRequestImage
                  request={request}
                  className="h-full w-full object-contain md:object-cover"
                />
              </div>

              {/* Text content: below image on mobile, left on desktop. */}
              <div className="absolute left-[11px] top-[229px] hidden flex-wrap items-center gap-[8px] md:left-[19px] md:top-[19px] md:flex">
                <JobTypeBadge jobType={request.jobType} />
                <StatusBadge status={request.status} />
              </div>

              <div className="absolute left-[11px] top-[335px] w-[296px] md:left-[19px] md:top-[65px] md:w-[760px]">
                {/* Mobile heading: separate lines matching Figma */}
                <div className="md:hidden">
                  <h3 className="text-[16px] font-medium leading-[28px] text-black">
                    {request.equipmentName}
                  </h3>
                  <p className="mt-[4px] text-[16px] font-medium leading-[28px] text-[#6B7280]">
                    {formatMobileId(request._id)}
                  </p>
                  {request.model ? (
                    <p className="mt-[3px] text-[14px] font-medium leading-[24px] text-[#6B7280]">Model:&nbsp;{request.model}</p>
                  ) : null}
                </div>

                {/* Desktop heading: inline format */}
                <h3 className="mt-[3px] hidden text-[20px] font-medium leading-[32px] text-black md:block">
                  {request.equipmentName}{" "}
                  <span className="text-[#6B7280]">
                    | {formatRequestId(request._id)}
                  </span>
                </h3>

                <div className="mt-[20px] md:mt-[18px]">
                  <RequestDetailRows request={request} />
                </div>

              </div>
            </div>

            <div className="absolute left-[11px] top-[613px] w-[296px] md:left-[19px] md:top-[293px] md:w-[1116px]">
              <div className="h-px w-full bg-[#DDE0E5]" />
              <p className="mt-[8px] text-[14px] font-normal leading-[20px] text-[#6B7280] md:mt-[7px]">
                {getRequesterLabel(request.requester)}
              </p>
            </div>

            <div className="absolute left-[11px] top-[693px] flex w-[296px] flex-col items-center gap-[20px] md:left-[19px] md:top-[364px] md:w-auto md:flex-row md:gap-[16px]">
              {request.status === ServiceRequestStatus.PENDING && !hasActiveDispute ? (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    isBusy={busy}
                    onClick={() => void updateStatus(request, ServiceRequestStatus.ACCEPTED)}
                    className="h-[60px] w-full rounded-[14px] border-0 px-5 text-[18px] font-normal leading-[32px] md:w-[320px]"
                  >
                    Accept
                  </Button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(request, ServiceRequestStatus.REJECTED)}
                    className="inline-flex h-[60px] w-full items-center justify-center rounded-[14px] border border-[#FE6E00] bg-[#FFF7F0] px-5 text-[18px] font-normal leading-[32px] text-[#FE6E00] disabled:opacity-60 md:w-[320px]"
                  >
                    Reject
                  </button>
                </>
              ) : null}

              {request.status === ServiceRequestStatus.ACCEPTED && !hasActiveDispute ? (
                <>
                  {/* Figma: Open chat is the primary CTA for accepted jobs */}
                  {requesterChatHref ? (
                    <Link
                      href={requesterChatHref}
                      className="inline-flex h-[60px] w-full items-center justify-center rounded-[14px] bg-primary px-5 text-[18px] font-normal leading-[32px] text-white md:w-[486px]"
                    >
                      Open chat
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatusDialogRequest(request)}
                    className="inline-flex h-[32px] items-center justify-center gap-[8px] text-[18px] font-normal leading-[32px] text-primary disabled:opacity-50"
                  >
                    Update Job Status
                    <ArrowRight className="size-6" aria-hidden />
                  </button>
                </>
              ) : null}

              {request.status === ServiceRequestStatus.IN_PROGRESS && !hasActiveDispute ? (
                <>
                  {requesterChatHref ? (
                    <Link
                      href={requesterChatHref}
                      className="inline-flex h-[60px] w-full items-center justify-center rounded-[14px] bg-primary px-5 text-[18px] font-normal leading-[32px] text-white md:w-[486px]"
                    >
                      Open chat
                    </Link>
                  ) : null}
                  <p className="text-sm text-[#6B7280]">
                    Buyer completion is required from the in-progress state.
                  </p>
                </>
              ) : null}

              {request.status === ServiceRequestStatus.ACCEPTED &&
              hasActiveDispute &&
              requesterChatHref ? (
                <Link
                  href={requesterChatHref}
                  className="inline-flex h-[60px] w-full items-center justify-center rounded-[14px] bg-primary px-5 text-[18px] font-normal leading-[32px] text-white md:w-[486px]"
                >
                  Open chat
                </Link>
              ) : null}

              {request.status === ServiceRequestStatus.IN_PROGRESS && hasActiveDispute ? (
                <>
                  {requesterChatHref ? (
                    <Link
                      href={requesterChatHref}
                      className="inline-flex h-[60px] w-full items-center justify-center rounded-[14px] bg-primary px-5 text-[18px] font-normal leading-[32px] text-white md:w-[486px]"
                    >
                      Open chat
                    </Link>
                  ) : null}
                  <p className="text-sm text-[#6B7280]">
                    Buyer completion is required from the in-progress state.
                  </p>
                </>
              ) : null}

              {(request.status === ServiceRequestStatus.REJECTED ||
                request.status === ServiceRequestStatus.COMPLETED ||
                request.status === ServiceRequestStatus.CLOSED_AFTER_DISPUTE) && (
                <p className="text-sm text-[#6B7280]">
                  {request.status === ServiceRequestStatus.REJECTED
                    ? "You rejected this request. No further action is available."
                    : request.status === ServiceRequestStatus.CLOSED_AFTER_DISPUTE
                      ? "This job was closed after dispute resolution."
                      : "This job is awaiting buyer-side review or follow-up only."}
                </p>
              )}
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
        onConfirm={confirmInProgress}
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
          if (failedStatusRequest) {
            void updateStatus(
              failedStatusRequest,
              ServiceRequestStatus.IN_PROGRESS,
              {
                showResult: true,
              },
            );
          }
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
