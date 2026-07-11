import { cn } from "@/lib/utils";

export type ProductCondition = "new" | "used" | "refurbished" | string | null | undefined;

export function formatConditionLabel(condition?: ProductCondition): string {
  if (!condition) {
    return "New";
  }

  return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
}

/** Uppercase badge label, e.g. USED / NEW / REFURBISHED */
export function formatConditionBadgeLabel(condition?: ProductCondition): string {
  return formatConditionLabel(condition).toUpperCase();
}

function isUsedCondition(condition?: ProductCondition): boolean {
  return (condition ?? "").toLowerCase() === "used";
}

function isRefurbishedCondition(condition?: ProductCondition): boolean {
  return (condition ?? "").toLowerCase() === "refurbished";
}

interface ConditionBadgeProps {
  condition?: ProductCondition;
  className?: string;
  /** Overlay placement on product images */
  overlay?: boolean;
  size?: "sm" | "md";
}

/**
 * Distinct condition badge for product cards and detail views.
 * Used items get a high-visibility USED treatment (not raw text).
 */
export default function ConditionBadge({
  condition,
  className,
  overlay = false,
  size = "sm",
}: ConditionBadgeProps) {
  const label = formatConditionBadgeLabel(condition);
  const used = isUsedCondition(condition);
  const refurbished = isRefurbishedCondition(condition);

  return (
    <span
      data-slot="condition-badge"
      data-condition={(condition ?? "new").toString().toLowerCase()}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wide",
        size === "sm" && "px-2 py-1 text-[10px] leading-none md:text-xs",
        size === "md" && "px-3 py-1.5 text-xs leading-none md:text-sm",
        used &&
          "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]",
        refurbished &&
          "border-[#C4B5FD] bg-[#F5F3FF] text-[#6D28D9]",
        !used &&
          !refurbished &&
          "border-[#FDE68A] bg-[#FDF5EB] text-[#AD7F59]",
        overlay && "absolute left-2 top-2 z-10 md:left-4 md:top-4",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          used && "bg-[#EA580C]",
          refurbished && "bg-[#7C3AED]",
          !used && !refurbished && "bg-[#FE6E00]",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
