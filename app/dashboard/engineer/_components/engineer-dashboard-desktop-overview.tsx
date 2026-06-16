"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

import { useAppSelector } from "@/hooks/useAppSelector";
import {
  ServiceRequestData,
  ServiceRequestStatus,
} from "@/types/service-request";

type EngineerDashboardDesktopOverviewProps = {
  requests: ServiceRequestData[];
};

type OverviewSegment = {
  label: string;
  value: number;
  color: string;
};

type TrendPoint = {
  label: string;
  value: number;
};

function formatCount(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function countByStatus(
  requests: ServiceRequestData[],
  statuses: ServiceRequestStatus[],
): number {
  return requests.filter((request) => statuses.includes(request.status)).length;
}

function formatRecentRequestId(id: string): string {
  const stripped = String(id).replace(/^[a-z]+-/i, "").toUpperCase();
  return `JR-${stripped.slice(-6)}`;
}

function formatRecentRequestMeta(request: ServiceRequestData): string {
  const location = request.serviceLocation?.split(",")[0]?.trim();
  return [request.jobType, location].filter(Boolean).join(" | ") || request.equipmentName;
}

function formatRecentRequestStatus(status: ServiceRequestStatus): string {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return "new";
    case ServiceRequestStatus.ACCEPTED:
    case ServiceRequestStatus.IN_PROGRESS:
      return "In progress";
    case ServiceRequestStatus.COMPLETED:
      return "Completed";
    case ServiceRequestStatus.REJECTED:
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "Rejected";
    default:
      return status;
  }
}

function recentRequestStatusClassName(status: ServiceRequestStatus): string {
  switch (status) {
    case ServiceRequestStatus.PENDING:
      return "bg-[#EAF4FF] text-[#0669D9]";
    case ServiceRequestStatus.ACCEPTED:
    case ServiceRequestStatus.IN_PROGRESS:
      return "bg-[#EAF4FF] text-[#0669D9]";
    case ServiceRequestStatus.COMPLETED:
      return "bg-[#FFF1E8] text-[#FE6E00]";
    case ServiceRequestStatus.REJECTED:
    case ServiceRequestStatus.CLOSED_AFTER_DISPUTE:
      return "bg-[#FFE8E4] text-[#E55B2D]";
    default:
      return "bg-[#F3F4F6] text-[#4B5563]";
  }
}

function relativeTimestampLabel(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfParsed = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
  const dayDiff = Math.round(
    (startOfNow.getTime() - startOfParsed.getTime()) / 86400000,
  );
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);

  if (dayDiff === 0) {
    return `Today ${timeLabel}`;
  }
  if (dayDiff === 1) {
    return `Yesterday ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
  return `${dateLabel} ${timeLabel}`;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function buildTrendPoints(requests: ServiceRequestData[]): TrendPoint[] {
  const parsedDates = requests
    .map((request) => new Date(request.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const anchor = parsedDates.at(-1) ?? new Date();
  const totalsByDay = new Map<string, number>();

  parsedDates.forEach((date) => {
    const key = dateKey(date);
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 5 }, (_, index) => {
    const date = subtractDays(anchor, 4 - index);
    return {
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date),
      value: totalsByDay.get(dateKey(date)) ?? 0,
    };
  });
}

function buildPolyline(points: TrendPoint[]) {
  const width = 460;
  const height = 220;
  const paddingX = 36;
  const paddingTop = 18;
  const paddingBottom = 22;
  const maxValue = Math.max(...points.map((point) => point.value), 4);
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const coords = points.map((point, index) => {
    const x =
      paddingX +
      (points.length === 1 ? innerWidth / 2 : (innerWidth / (points.length - 1)) * index);
    const y =
      paddingTop +
      innerHeight -
      (point.value / maxValue) * innerHeight;
    return { x, y };
  });

  const polylinePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const areaPoints = [
    `${coords[0]?.x ?? paddingX},${height - paddingBottom}`,
    ...coords.map((coord) => `${coord.x},${coord.y}`),
    `${coords.at(-1)?.x ?? width - paddingX},${height - paddingBottom}`,
  ].join(" ");

  const ticks = Array.from({ length: 5 }, (_, index) =>
    Math.round((maxValue / 4) * (4 - index)),
  );

  return {
    areaPoints,
    coords,
    gridLines: ticks.map((tick, index) => ({
      label: tick,
      y: paddingTop + (innerHeight / 4) * index,
    })),
    polylinePoints,
  };
}

function buildDonutGradient(segments: OverviewSegment[]): string {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) {
    return "conic-gradient(#E5E7EB 0deg 360deg)";
  }

  let current = 0;
  const stops = segments.map((segment) => {
    const start = current;
    current += (segment.value / total) * 360;
    return `${segment.color} ${start}deg ${current}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function EngineerDashboardDesktopOverview({
  requests,
}: EngineerDashboardDesktopOverviewProps) {
  const statusCounts = useAppSelector((state) => state.serviceRequest.statusCounts);

  const segments = useMemo<OverviewSegment[]>(() => {
    const newRequests =
      statusCounts?.pending ??
      countByStatus(requests, [ServiceRequestStatus.PENDING]);
    const inProgress = countByStatus(requests, [
      ServiceRequestStatus.ACCEPTED,
      ServiceRequestStatus.IN_PROGRESS,
    ]);
    const completed =
      statusCounts?.completed ??
      countByStatus(requests, [ServiceRequestStatus.COMPLETED]);
    const rejected =
      (statusCounts?.rejected ?? 0) +
      countByStatus(requests, [ServiceRequestStatus.CLOSED_AFTER_DISPUTE]);

    return [
      { label: "New Request", value: newRequests, color: "#0669D9" },
      { label: "In Progress", value: inProgress, color: "#FE6E00" },
      { label: "Completed", value: completed, color: "#12A150" },
      { label: "Rejected", value: rejected, color: "#E55B2D" },
    ];
  }, [requests, statusCounts]);

  const donutTotal = segments.reduce((sum, segment) => sum + segment.value, 0);
  const donutGradient = buildDonutGradient(segments);
  const trendPoints = useMemo(() => buildTrendPoints(requests), [requests]);
  const trendGeometry = useMemo(() => buildPolyline(trendPoints), [trendPoints]);

  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 4),
    [requests],
  );

  return (
    <section className="mx-auto mt-5 hidden w-full max-w-[1160px] space-y-5 md:block">
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[18px] border border-[#E6ECF2] bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-medium leading-[28px] text-[#111827]">
                Job Requests Overview
              </h2>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full text-sm text-[#4B5563]"
            >
              This week
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between gap-6">
            <div
              className="relative flex size-[214px] items-center justify-center rounded-full"
              style={{ background: donutGradient }}
            >
              <div className="flex size-[144px] flex-col items-center justify-center rounded-full bg-white text-[#111827]">
                <span className="text-[26px] font-medium leading-none">
                  {formatCount(donutTotal)}
                </span>
                <span className="mt-3 text-[15px] text-[#6B7280]">Total</span>
              </div>
            </div>

            <div className="min-w-[230px] space-y-6">
              {segments.map((segment) => {
                const percent = donutTotal
                  ? Math.round((segment.value / donutTotal) * 100)
                  : 0;

                return (
                  <div
                    key={segment.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 text-[14px] text-[#4B5563]">
                      <span
                        className="size-4 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span>{segment.label}</span>
                    </div>
                    <span className="text-[14px] font-medium text-[#111827]">
                      {formatCount(segment.value)} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t border-[#E6ECF2] pt-6 text-center">
            <Link
              href="/dashboard/engineer/job-requests"
              className="inline-flex items-center gap-2 text-[15px] text-primary"
            >
              view all job request
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <article className="rounded-[18px] border border-[#E6ECF2] bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-medium leading-[28px] text-[#111827]">
                Jobs Trend
              </h2>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full text-sm text-[#4B5563]"
            >
              This month
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </div>

          <div className="mt-6">
            <svg
              viewBox="0 0 520 260"
              className="h-[270px] w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="engineer-trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0669D9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0669D9" stopOpacity="0" />
                </linearGradient>
              </defs>

              {trendGeometry.gridLines.map((line) => (
                <g key={`grid-${line.label}-${line.y}`}>
                  <text
                    x="4"
                    y={line.y + 4}
                    fontSize="12"
                    fill="#9CA3AF"
                    fontFamily="inherit"
                  >
                    {line.label}
                  </text>
                  <line
                    x1="36"
                    y1={line.y}
                    x2="484"
                    y2={line.y}
                    stroke="#DDE0E5"
                    strokeWidth="1"
                  />
                </g>
              ))}

              <polygon points={trendGeometry.areaPoints} fill="url(#engineer-trend-fill)" />
              <polyline
                points={trendGeometry.polylinePoints}
                fill="none"
                stroke="#0669D9"
                strokeWidth="2.5"
              />

              {trendGeometry.coords.map((coord, index) => (
                <circle
                  key={`dot-${trendPoints[index]?.label ?? index}`}
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#0669D9"
                />
              ))}

              {trendPoints.map((point, index) => (
                <text
                  key={`label-${point.label}`}
                  x={trendGeometry.coords[index]?.x ?? 0}
                  y="248"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6B7280"
                  fontFamily="inherit"
                >
                  {point.label}
                </text>
              ))}
            </svg>
          </div>

          <div className="mt-1 text-center">
            <Link
              href="/dashboard/engineer/job-requests"
              className="inline-flex items-center gap-2 text-[15px] text-primary"
            >
              view all job request
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>
      </div>

      <article className="rounded-[18px] border border-[#E6ECF2] bg-white px-8 py-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[18px] font-medium leading-[28px] text-[#111827]">
            Recent Job Requests
          </h2>
          <Link
            href="/dashboard/engineer/job-requests"
            className="text-[15px] text-primary"
          >
            view all
          </Link>
        </div>

        <div className="mt-6">
          {recentRequests.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#DDE0E5] px-6 py-10 text-center text-sm text-[#6B7280]">
              No job requests yet.
            </div>
          ) : (
            recentRequests.map((request, index) => (
              <Link
                key={request._id}
                href="/dashboard/engineer/job-requests"
                className={`grid grid-cols-[220px_minmax(0,1fr)_200px] items-center gap-4 py-6 text-[#111827] transition hover:bg-[#FBFCFE] ${
                  index > 0 ? "border-t border-[#EEF2F7]" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-[18px] font-medium leading-none">
                    {formatRecentRequestId(request._id)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-[14px] leading-none ${recentRequestStatusClassName(
                      request.status,
                    )}`}
                  >
                    {formatRecentRequestStatus(request.status)}
                  </span>
                </div>

                <p className="truncate pr-4 text-[16px] text-[#4B5563]">
                  {formatRecentRequestMeta(request)}
                </p>

                <div className="flex items-center justify-end gap-3 text-[16px] text-[#4B5563]">
                  <span>{relativeTimestampLabel(request.updatedAt || request.createdAt)}</span>
                  <ArrowRight className="size-4 text-[#6B7280]" aria-hidden />
                </div>
              </Link>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
