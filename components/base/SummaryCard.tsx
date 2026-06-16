import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  subtitle?: string;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  subtitle,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray5 bg-white p-5 min-h-[128px] flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <p className="text-sm font-normal text-gray1">{title}</p>
          <p className="text-lg font-medium text-gray1">{value}</p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs font-normal text-gray3">{subtitle}</p>
      )}
    </div>
  );
}
