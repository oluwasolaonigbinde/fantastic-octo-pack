"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface OverviewNoticeBannerProps {
  text: string;
  onDismiss?: () => void;
  /** Merged with default banner styles (e.g. engineer-only mobile rhythm). */
  className?: string;
}

export function OverviewNoticeBanner({
  text,
  onDismiss,
  className,
}: OverviewNoticeBannerProps) {
  return (
    <div
      className={cn(
        "type-body-md flex items-center justify-between gap-3 rounded-xl border border-secondary/20 bg-secondary-light px-4 py-3 text-secondary",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <CircleAlert className="size-4" />
        {text}
      </span>
      <button
        type="button"
        aria-label={`Dismiss notice: ${text}`}
        className="text-secondary/70 hover:text-secondary"
        onClick={() => onDismiss?.()}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

interface OverviewMetricCardProps {
  title: string;
  value: string;
  meta: string;
  accent: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}

export function OverviewMetricCard({
  title,
  value,
  meta,
  accent,
  actionLabel,
  actionHref,
  icon,
}: OverviewMetricCardProps) {
  const actionClassName =
    "type-label-sm mt-4 inline-flex items-center gap-2 font-medium text-primary";

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-label-sm text-gray3">{title}</p>
          <p className="type-heading-xl mt-2 font-semibold text-gray1">
            {value}
          </p>
          <p className="type-caption mt-3 text-gray4">{meta}</p>
        </div>
        <span
          className="inline-flex size-10 items-center justify-center rounded-xl text-gray1"
          style={{ backgroundColor: accent }}
        >
          {icon ?? <span className="size-4 rounded-full bg-white/80" />}
        </span>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClassName}>
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : actionLabel ? (
        <button type="button" className={actionClassName}>
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </button>
      ) : null}
    </article>
  );
}

interface OverviewDateRangeFieldProps {
  label: string;
}

export function OverviewDateRangeField({ label }: OverviewDateRangeFieldProps) {
  return (
    <div className="relative min-w-[164px]">
      <input
        aria-label={label}
        type="text"
        value=""
        placeholder="From - To"
        readOnly
        className="type-body-md h-11 w-full rounded-xl border border-border bg-card px-4 pr-10 text-gray4 outline-none"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray4" />
    </div>
  );
}

interface OverviewSectionHeadingProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function OverviewSectionHeading({
  title,
  subtitle,
  action,
}: OverviewSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="type-heading-lg font-semibold text-gray1">{title}</h2>
        <p className="type-body-md text-gray3">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
