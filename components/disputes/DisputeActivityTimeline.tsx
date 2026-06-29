"use client";

import {
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Flag,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";

import type { DisputeActivityEvent } from "@/lib/order-dispute-presenter";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const roleBadgeClass: Record<DisputeActivityEvent["roleTone"], string> = {
  buyer: "bg-[#EAF9FF] text-[#0669D9]",
  seller: "bg-[#EAF9FF] text-[#0669D9]",
  admin: "bg-[#FFF6D9] text-[#FFC000]",
  neutral: "bg-[#F3F4F6] text-[#6B7280]",
};

function ActivityIcon({ variant }: { variant: DisputeActivityEvent["variant"] }) {
  switch (variant) {
    case "flag":
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#FFE3DD] text-[#E33C13]">
          <Flag size={16} />
        </span>
      );
    case "check":
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
          <CheckCircle2 size={16} />
        </span>
      );
    case "pending":
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
          <Clock size={16} />
        </span>
      );
    case "seller":
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#EAF9FF] text-[#0669D9]">
          <User size={16} />
        </span>
      );
    case "admin":
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#FFF6D9] text-[#FFC000]">
          <ShieldCheck size={16} />
        </span>
      );
    default:
      return (
        <span className="flex size-8 items-center justify-center rounded-full bg-[#F4E7FE] text-[#9333EA]">
          <Plus size={16} />
        </span>
      );
  }
}

/**
 * The messaging-style dispute activity feed shared by the buyer and distributor
 * dispute detail pages. Pass `showHeader` to render the "Dispute ACTIVITY"
 * title and the activity filter chip.
 */
export function DisputeActivityTimeline({
  events,
  showHeader = true,
}: {
  events: DisputeActivityEvent[];
  showHeader?: boolean;
}) {
  return (
    <section className="flex max-h-[600px] flex-col rounded-2xl border border-[#DDE0E5] bg-white p-5">
      {showHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">Dispute ACTIVITY</h2>
          <span className="inline-flex items-center gap-1 rounded-lg border border-[#C4C8CE] px-3 py-1 text-sm text-[#6B7280]">
            All activities
            <ChevronDown size={15} />
          </span>
        </div>
      ) : null}

      <div
        className={`min-h-0 flex-1 overflow-y-auto pr-1 ${
          showHeader ? "mt-6 space-y-3" : "space-y-3"
        }`}
      >
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-5">
            <div className="flex flex-col items-center">
              <ActivityIcon variant={event.variant} />
              {index < events.length - 1 ? (
                <span className="mt-1 w-px flex-1 bg-[#DDE0E5]" />
              ) : null}
            </div>
            <div className="mb-3 flex-1 rounded-xl border border-[#F3F4F6] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#111827]">{event.title}</p>
                  <span
                    className={`rounded-lg px-3 py-0.5 text-xs font-medium ${roleBadgeClass[event.roleTone]}`}
                  >
                    {event.roleLabel}
                  </span>
                </div>
                <p className="shrink-0 text-xs text-[#4B5563]">
                  {formatDateTime(event.timestamp)}
                </p>
              </div>
              {event.text ? (
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">{event.text}</p>
              ) : null}
              {event.attachment ? (
                <a
                  href={event.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#C4C8CE] px-3 py-1 text-xs text-[#6B7280]"
                >
                  <FileText size={14} />
                  {event.attachment.fileName}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DisputeActivityTimeline;
