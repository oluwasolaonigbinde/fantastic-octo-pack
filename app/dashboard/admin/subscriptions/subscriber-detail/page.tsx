"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Circle } from "lucide-react";

import Header from "@/app/dashboard/component/header";

const subscriberFields = [
  ["Name of subscriber", "Samuel Smart"],
  ["Email address", "example245@gmail.com"],
  ["Start Date", "28/11/2025"],
  ["End date", "28/11/2025"],
  ["Usage limit", "2 - months"],
  ["Renewal status", "Auto - renewal"],
] as const;

const access = [
  ["Visibility level", "Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque mi."],
  ["RFQ Access", "Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque mi fermentum nisl."],
  ["Messaging Access", "Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque mi fermentum nisl."],
] as const;

const plans = [
  {
    title: "Free Plan",
    price: "This is a free plan",
    sub: "No fee is required",
    active: false,
  },
  {
    title: "Basic Plan",
    price: "₦50,000 / month",
    sub: "₦150,000 billed yearly",
    active: true,
  },
  {
    title: "Premium Plan",
    price: "₦75,000 / month",
    sub: "₦225,000 billed yearly",
    active: false,
  },
] as const;

export default function AdminSubscriptionSubscriberDetailPage() {
  return (
    <div className="min-h-[1457px] bg-gray7">
      <Header title="Subscription" description="View all subscribed users." />

      <main className="px-4 pt-5">
        <Link
          href="/dashboard/admin/subscriptions"
          className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-gray1"
        >
          <ArrowLeft size={24} strokeWidth={1.75} />
          Go Back
        </Link>

        <section className="mt-5 h-[198px] rounded-2xl border border-gray5 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[13px]">
              <div className="size-[158px] overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/admin-subscriber-avatar.png"
                  alt=""
                  className="size-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-x-[70px] gap-y-[17px]">
                {subscriberFields.map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-[12px] font-normal leading-[17px] text-gray3">{label}</p>
                    <p className="text-sm font-normal leading-5 text-gray1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-[39px]">
              <div className="space-y-0.5">
                <p className="text-sm font-normal leading-5 text-gray3">Status</p>
                <p className="text-base font-normal leading-6 text-success">ACTIVE</p>
              </div>
              <button
                type="button"
                className="flex h-12 w-[152px] items-center justify-center rounded-xl bg-danger text-sm font-normal leading-5 text-white"
              >
                Suspend user
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 flex h-[124px] items-center justify-between rounded-2xl border border-gray5 bg-white px-5 opacity-90">
          <div className="flex items-center gap-[66px]">
            <div className="rounded-lg border border-[#AAD3F3] bg-[#F6FBFF] py-[18px] pl-6 pr-14">
              <p className="text-base font-normal leading-6 text-gray2">Current Plan</p>
              <p className="text-lg font-medium leading-6 text-gray1">Basic Plan</p>
            </div>
            <div className="h-12 border-l border-gray5" />
            <div>
              <p className="text-base font-normal leading-6 text-gray2">Fee</p>
              <p className="text-lg font-medium leading-6 text-gray1">₦25,000</p>
            </div>
            <div className="h-12 border-l border-gray5" />
            <div>
              <p className="text-base font-normal leading-6 text-gray2">Renewal date</p>
              <p className="text-lg font-medium leading-6 text-gray1">30th May 2025</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-14 w-[250px] items-center justify-center gap-2 rounded-xl bg-primary text-base font-normal leading-6 text-white"
          >
            Extend plan
            <ArrowRight size={24} />
          </button>
        </section>

        <section className="mt-4 h-[670px] rounded-2xl border border-gray5 bg-white px-5 py-[34px] opacity-90">
          <h2 className="mb-[39px] text-xl font-medium leading-8 text-gray1">All available plans - 3</h2>

          <div className="grid grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.title}
                className={`h-40 rounded-xl border p-5 ${
                  plan.active ? "border-[#1661F5] bg-[#F6FBFF]" : "border-gray6 bg-white"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lg font-normal leading-7 text-black">
                    <Circle
                      size={18}
                      fill={plan.active ? "#1661F5" : "#F3F4F6"}
                      className={plan.active ? "text-[#1661F5]" : "text-gray5"}
                    />
                    {plan.title}
                  </div>
                  {plan.active ? (
                    <span className="rounded border border-[#58ACFA] bg-[#EAF9FF] px-2.5 py-[3px] text-sm font-normal leading-5 text-primary">
                      Current Plan
                    </span>
                  ) : null}
                </div>
                <div className="border-t border-gray6 pt-4">
                  <p className="text-lg font-semibold leading-8 text-gray1">{plan.price}</p>
                  <p className="text-base font-normal leading-6 text-gray3">{plan.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-5">
            {access.map(([title, body]) => (
              <div key={title}>
                <h3 className="text-lg font-normal leading-6 text-gray1">{title}</h3>
                <p className="mt-1 text-base font-normal leading-6 text-gray2">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-[90px]">
            <h3 className="text-lg font-normal leading-6 text-gray1">Features</h3>
            <div className="mt-5 grid grid-cols-2 gap-x-[360px] gap-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="flex size-[18px] items-center justify-center rounded-sm border border-primary text-primary">
                    <Check size={14} />
                  </span>
                  <span className="text-base font-normal leading-6 text-gray2">
                    Lorem ipsum dolor sit amet consectetur.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 flex h-[124px] items-center rounded-2xl border border-gray5 bg-white px-5">
          <div className="flex gap-5">
            <button
              type="button"
              className="flex h-[60px] w-[320px] items-center justify-center gap-2 rounded-[14px] border border-[#FE6E00] text-lg font-normal leading-8 text-[#FE6E00]"
            >
              Downgrade Plan
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              className="flex h-[60px] w-[320px] items-center justify-center gap-2 rounded-[14px] bg-primary text-lg font-normal leading-8 text-white"
            >
              Get Plan
              <ArrowRight size={24} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
