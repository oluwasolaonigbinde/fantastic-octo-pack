"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";

import Header from "../../../component/header";
import { Button } from "@/components/base";

const plans = [
  {
    name: "Free",
    badge: "(current)",
    badgeClass: "bg-gray6 text-gray2",
    price: "N0.00",
    action: null,
  },
  {
    name: "Starter",
    badgeClass: "bg-[#E7F7FF] text-primary",
    price: "N0.00",
    action: "Upgrade to Bronze",
  },
  {
    name: "Bronze",
    badgeClass: "bg-[#FFF0E6] text-[#FE6E00]",
    price: "N0.00",
    action: "Upgrade to Bronze",
  },
  {
    name: "Gold",
    badgeClass: "bg-[#FFF5DB] text-[#F6B90A]",
    price: "N0.00",
    action: "Upgrade to Bronze",
  },
  {
    name: "Platinum",
    badgeClass: "bg-[#E8FAEE] text-[#13A83B]",
    price: "N0.00",
    action: "Upgrade to Bronze",
  },
];

const billingPeriods = ["1 Month", "3 Months (save 5%)", "6 Months (save 5%)", "9 Month (Save 15%)"];
const features = [
  "Upload up to 25 products",
  "Full buyer message",
  "Respond to RFQs",
  "Bulk product upload",
  "Basic Analytics",
];

function CollapsedSection({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-t border-gray5 pt-5 text-gray2">
      <span className="text-base font-semibold leading-6">{title}</span>
      <ChevronDown size={16} className="text-gray2" />
    </div>
  );
}

function ExpandedPlanContent() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-gray2">
          <span className="text-base font-semibold leading-6">Billing Period</span>
          <ChevronDown size={16} className="rotate-180 text-gray2" />
        </div>
        <div className="mt-4 space-y-3 rounded-xl bg-[#FDFDFE] px-3 py-4">
          {billingPeriods.map((period, index) => (
            <div
              key={period}
              className={`flex items-center gap-2 rounded-xl border p-2 text-base ${
                index === 3
                  ? "border-primary bg-primary/10 font-semibold text-gray2"
                  : "border-gray6 text-gray2"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full border ${
                  index === 3 ? "border-primary" : "border-gray4"
                }`}
              >
                {index === 3 ? <span className="size-2.5 rounded-full bg-primary" /> : null}
              </span>
              <span>{period}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-lg font-bold leading-8 text-gray2">Total: N202,500</p>
      </div>

      <div>
        <div className="flex items-center justify-between text-gray2">
          <span className="text-base font-semibold leading-6">Features</span>
          <ChevronDown size={16} className="rotate-180 text-gray2" />
        </div>
        <div className="mt-5 space-y-4">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-base font-semibold text-gray2">
              <Check size={17} className="text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, expanded }: { plan: (typeof plans)[number]; expanded: boolean }) {
  return (
    <article className="flex min-h-[448px] flex-col justify-between rounded-xl border border-gray5 bg-white p-5">
      <div className="space-y-10">
        <div className="space-y-4 border-b border-gray5 pb-10">
          <div className={`inline-flex items-center gap-2 rounded-[20px] px-5 py-2 text-2xl font-semibold ${plan.badgeClass}`}>
            <span>{plan.name}</span>
            {plan.badge ? <span>{plan.badge}</span> : null}
          </div>
          <p className="text-[32px] font-semibold leading-[48px] text-gray2">{plan.price}</p>
          <p className="text-xl leading-8 text-gray3">Design for growing distributors</p>
        </div>

        {expanded ? (
          <ExpandedPlanContent />
        ) : (
          <div className="space-y-5">
            <CollapsedSection title="Billing Period" />
            <CollapsedSection title="Features" />
          </div>
        )}
      </div>

      {plan.action ? (
        <Button title={plan.action} className="mt-10 h-14 w-full rounded-lg" type="button" />
      ) : (
        <div className="mt-10 h-14" />
      )}
    </article>
  );
}

export default function AdminSubscriptionPlansPage() {
  return (
    <div>
      <Header
        title="Subscriptions"
        description="View all analytics and create new subscriptions."
      />

      <main className="px-4 py-4 md:px-4 md:py-4">
        <Link
          href="/dashboard/admin/subscriptions"
          className="inline-flex items-center gap-2 text-lg leading-8 text-gray1"
        >
          <ArrowLeft size={24} />
          Go Back
        </Link>

        <section className="mt-10 min-h-[1217px] rounded-[20px] border border-gray5 bg-white/70 p-10">
          <div className="space-y-5">
            <div>
              <h2 className="text-[28px] font-bold leading-[42px] text-gray1">Subscriptions</h2>
              <p className="text-[17px] font-semibold leading-8 text-gray3">
                Choose a plan that fits your business stage
              </p>
            </div>

            <div className="grid max-w-[1074px] gap-4 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <PlanCard key={plan.name} plan={plan} expanded={index === 0} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
