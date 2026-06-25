"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Box,
  ChevronRight,
  KeyRound,
  Landmark,
  Pencil,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import Header from "@/app/dashboard/component/header";

const profileRows = [
  ["User ID", "4TIJJBN343I0-48J-4546", "add"],
  ["Phone Number", "+2348576542934", "edit"],
  ["Email", "users@gmail.com", "edit"],
  ["Date Joined", "5th March, 2024", null],
  ["Country", "Nigeria", null],
] as const;

const actions = [
  {
    title: "Operations",
    description: "View full profile, user details and activity",
    icon: Settings,
  },
  {
    title: "Compliance",
    description: "Products, store and verification history",
    icon: Box,
  },
  {
    title: "Financial",
    description: "Wallet, Subscription & Billing",
    icon: Landmark,
  },
  {
    title: "Disputes",
    description: "Disputes and resolution history",
    icon: Search,
  },
  {
    title: "Relationships",
    description: "OEM relationships and assigned agent",
    icon: Users,
  },
  {
    title: "System Control",
    description: "Permission, Activity Log, Analytics",
    icon: KeyRound,
  },
] as const;

export default function AdminDistributorDetailPage() {
  return (
    <div className="min-h-[1688px] bg-gray7">
      <Header
        title="Platform Users"
        description="View all users and process onboarding request from users"
      />

      <main className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/admin/platform-users"
            className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-primary"
          >
            <ArrowLeft size={24} strokeWidth={1.75} />
            Go Back
          </Link>

          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-danger"
          >
            <Ban size={18} strokeWidth={1.8} />
            Suspend Account
          </button>
        </div>

        <section className="mt-5 w-full rounded-2xl border border-gray5 bg-white px-10 py-10">
          <div className="grid gap-10 xl:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-8 py-6">
              <div className="flex flex-col items-center gap-4">
                <div className="size-[120px] overflow-hidden rounded-full bg-gray6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/admin-distributor-avatar.jpg"
                    alt=""
                    className="size-full object-cover"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <h1 className="text-center text-[32px] font-medium leading-[48px] text-gray1">
                    Emmanuella Ifeanyi
                  </h1>
                  <div className="flex flex-col items-center gap-3">
                    <span className="rounded-lg bg-[#EAF9FF] px-2 py-1 text-base font-normal leading-6 text-primary">
                      Distributor
                    </span>
                    <span className="inline-flex items-center gap-3 rounded-lg bg-[rgba(107,114,128,0.06)] p-2 text-lg font-medium leading-6 text-success">
                      <BadgeCheck size={24} fill="currentColor" className="text-success" />
                      KYC Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray5" />

              <div className="flex flex-col gap-5">
                {profileRows.map(([label, value, action]) => (
                  <div key={label} className="border-b border-gray5 pb-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-normal leading-5 text-gray2">{label}</p>
                        <p className="w-[406px] text-xl font-semibold leading-8 text-gray1">
                          {value}
                        </p>
                      </div>

                      {action === "add" ? (
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray5 px-2 text-base font-normal leading-6 text-gray1"
                        >
                          <Plus size={20} />
                          Add User ID
                        </button>
                      ) : null}

                      {action === "edit" ? (
                        <button
                          type="button"
                          aria-label={`Edit ${label}`}
                          className="flex size-10 items-center justify-center rounded-xl bg-gray6 text-gray2"
                        >
                          <Pencil size={20} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-2 self-start text-lg font-normal leading-8 text-danger"
                >
                  <Ban size={18} strokeWidth={1.8} />
                  Suspend Account
                </button>
              </div>
            </div>

            <aside className="border-l border-gray5 pl-6 pt-6">
              <div className="mb-5 space-y-1">
                <h2 className="text-xl font-semibold leading-8 text-gray1">Actions</h2>
                <p className="text-sm font-normal leading-5 text-gray2">
                  Manage platform actions for this distributor.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {actions.map(({ title, description, icon: Icon }) => (
                  <button
                    key={title}
                    type="button"
                    className="flex h-[78px] w-full items-center justify-between rounded-[20px] border border-gray6 bg-white px-2 py-3 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex size-[62px] items-center justify-center rounded-[20px] bg-[#EAF9FF] text-primary">
                        <Icon size={38} strokeWidth={1.8} />
                      </span>
                      <span className="flex min-w-0 flex-col justify-center">
                        <span className="text-xl font-semibold leading-8 text-gray1">
                          {title}
                        </span>
                        <span className="text-base font-normal leading-6 text-gray2">
                          {description}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={22} strokeWidth={1.8} className="text-primary" />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
