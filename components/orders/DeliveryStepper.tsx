"use client";

import { Check } from "lucide-react";

interface DeliveryStepperProps {
  /** Number of milestones that are complete (lit). */
  activeCount: number;
  /** Ordered milestone labels — see `getOrderMilestones`. */
  milestones: string[];
  /** Vertical, mobile-friendly layout (matches the order tracking design). */
  compact?: boolean;
}

/**
 * Order progress stepper shared by the buyer and distributor order views so the
 * bars stay identical. `compact` renders the vertical mobile layout; the default
 * renders the horizontal desktop layout.
 */
export default function DeliveryStepper({
  activeCount,
  milestones,
  compact = false,
}: DeliveryStepperProps) {
  if (compact) {
    return (
      <div className="flex flex-col">
        {milestones.map((milestone, index) => {
          const active = index < activeCount;
          const isLast = index === milestones.length - 1;
          return (
            <div key={milestone} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md text-white ${
                    active ? "bg-[#16A34A]" : "bg-[#E5E7EB]"
                  }`}
                >
                  <Check size={15} />
                </span>
                {!isLast ? (
                  <span
                    className={`w-px flex-1 ${
                      index < activeCount ? "bg-[#16A34A]" : "bg-[#DDE0E5]"
                    }`}
                  />
                ) : null}
              </div>
              <span
                className={`pt-1 text-sm font-medium ${
                  isLast ? "" : "pb-8"
                } ${active ? "text-[#16A34A]" : "text-[#4B5563]"}`}
              >
                {milestone}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`mt-10 grid gap-0 ${
        milestones.length === 6 ? "grid-cols-6" : "grid-cols-5"
      }`}
    >
      {milestones.map((milestone, index) => {
        const active = index < activeCount;
        return (
          <div key={milestone} className="relative flex flex-col items-center gap-4">
            {index < milestones.length - 1 ? (
              <span
                className={`absolute left-1/2 top-[10px] h-px w-full ${
                  index < activeCount - 1 ? "bg-[#16A34A]" : "bg-[#DDE0E5]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-[1] flex size-5 items-center justify-center rounded-sm ${
                active ? "bg-[#16A34A] text-white" : "bg-[#DDE0E5] text-white"
              }`}
            >
              <Check size={13} />
            </span>
            <span
              className={`text-center text-sm ${
                active ? "text-[#16A34A]" : "text-[#4B5563]"
              }`}
            >
              {milestone}
            </span>
          </div>
        );
      })}
    </div>
  );
}
