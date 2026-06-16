"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type DistributorActionTone = "blue" | "amber" | "orange";

export interface DistributorActionItem {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  tone: DistributorActionTone;
}

const toneStyles: Record<
  DistributorActionTone,
  {
    card: string;
    icon: string;
    button: string;
  }
> = {
  blue: {
    card: "bg-[#EFF4FF]",
    icon: "bg-[#0669D9] text-white",
    button: "bg-[#0669D9] text-white",
  },
  amber: {
    card: "bg-[#FDF5E8]",
    icon: "bg-[#F5A623] text-white",
    button: "bg-[#F5A623] text-white",
  },
  orange: {
    card: "bg-[#FDF5E8]",
    icon: "bg-[#FE6E00] text-white",
    button: "bg-[#FE6E00] text-white",
  },
};

export function DistributorActionCenter({
  items,
}: {
  items: DistributorActionItem[];
}) {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[20px] font-medium leading-8 text-[#111827]">
            Action Center
          </h2>
          <p className="text-sm leading-5 text-[#4B5563]">
            Top 10 recently listed equipment and consumables
          </p>
        </div>
        <Link
          href="/dashboard/distributor/catalogue"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0669D9]"
        >
          <span>View All Product</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const styles = toneStyles[item.tone];

          return (
            <div
              key={`${item.title}-${item.cta}`}
              className={`flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between ${styles.card}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-[20px] font-semibold leading-8 text-[#111827]">
                    {item.title}
                  </p>
                  <p className="text-base leading-6 text-[#4B5563]">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <Link
                href={item.href}
                className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium ${styles.button}`}
              >
                {item.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
