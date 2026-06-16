import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { allBusinessOwners, type BusinessOwner } from "../../mockdata";

export type OwnerDetailTab =
  | "KYC & Verification"
  | "Orders"
  | "Products"
  | "Subscription"
  | "ESCROW"
  | "Disputes";

const detailTabs: Array<{ label: OwnerDetailTab; href: (id: string) => string }> = [
  {
    label: "KYC & Verification",
    href: (id) => `/dashboard/agent/business-owners/${id}`,
  },
  {
    label: "Orders",
    href: (id) => `/dashboard/agent/business-owners/${id}/orders`,
  },
  {
    label: "Products",
    href: (id) => `/dashboard/agent/business-owners/${id}/catalogue`,
  },
  {
    label: "Subscription",
    href: (id) => `/dashboard/agent/business-owners/${id}/subscription`,
  },
  {
    label: "ESCROW",
    href: (id) => `/dashboard/agent/business-owners/${id}/escrow`,
  },
  {
    label: "Disputes",
    href: (id) => `/dashboard/agent/business-owners/${id}/disputes`,
  },
];

const subscriptionHiddenBusinessTypes = new Set<BusinessOwner["businessType"]>([
  "Buyer",
  "OEM",
]);

export function getOwnerForId(id: string): BusinessOwner {
  return allBusinessOwners.find((owner) => owner.id === id) ?? allBusinessOwners[0];
}

function DetailStat({
  label,
  value,
  tone = "text-[#111827]",
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="min-w-0 border-r border-[#E5E7EB] pr-4 last:border-r-0 md:min-w-[130px] md:pr-6">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className={`text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  bg: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 md:min-w-[170px]">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: bg }}
      >
        {icon}
      </span>
      <span>
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-sm font-medium text-[#111827]">{value}</p>
      </span>
    </div>
  );
}

export function OwnerDetailShell({
  ownerId,
  activeTab,
  children,
}: {
  ownerId: string;
  activeTab: OwnerDetailTab;
  children: ReactNode;
}) {
  const owner = getOwnerForId(ownerId);
  const headerTitle =
    owner.businessType === "Buyer"
      ? "Buyers"
      : owner.businessType === "OEM"
        ? "OEMs"
        : "Business Owners";
  const entityTitle =
    owner.businessType === "Buyer"
      ? "The name of buyer"
      : owner.businessType === "OEM"
        ? "The name of OEM"
        : "The name of business";
  const roleValue =
    owner.businessType === "Buyer" || owner.businessType === "OEM"
      ? "Distributor"
      : owner.businessType;
  const tabs = detailTabs.filter(
    (tab) =>
      tab.label !== "Subscription" ||
      !subscriptionHiddenBusinessTypes.has(owner.businessType),
  );

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title={headerTitle}
        description="Wednesday 10th September, 2025"
        mobileChrome="profile"
      />
      <main className="min-h-[1651px] space-y-4 bg-[#F5F7FA] p-5 md:min-h-[calc(100vh-100px)] md:p-6">
        <Link
          href="/dashboard/agent/business-owners"
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="overflow-hidden rounded-xl border border-[#EEF0F3] bg-white">
          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4">
              <h1 className="max-w-[150px] text-base font-semibold text-[#111827] md:max-w-none md:text-xl">
                {entityTitle}
              </h1>
              <div className="shrink-0 text-right">
                <p className="text-[10px] leading-4 text-[#6B7280] md:text-xs">
                  Your Earnings from this business
                </p>
                <p className="text-sm font-semibold text-[#111827] md:text-2xl md:font-bold">
                  {"\u20A6"}150, 000
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-b border-[#F3F4F6] pb-6 md:mt-10 md:flex md:flex-wrap md:gap-5 md:pb-10 xl:gap-10">
              <InfoItem
                label="Role:"
                value={roleValue}
                bg="#EAF9FF"
                icon={<User size={20} className="text-[#0669D9]" />}
              />
              <InfoItem
                label="Phone number:"
                value="08184318676"
                bg="#FFF7F0"
                icon={<Phone size={20} className="text-[#FE6E00]" />}
              />
              <InfoItem
                label="Address"
                value={owner.address}
                bg="#FFF6D9"
                icon={<MapPin size={20} className="text-[#F59E0B]" />}
              />
              <InfoItem
                label="Onboarded date;"
                value={owner.onboardedDate}
                bg="#FFE7D4"
                icon={<Calendar size={20} className="text-[#8E4106]" />}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 md:mt-7 md:flex md:flex-wrap md:gap-5 xl:gap-8">
              <DetailStat label="Total processed Orders" value={owner.totalOrders} />
              <DetailStat
                label={owner.businessType === "Buyer" ? "ESCRO Held" : "ESCROW Balance"}
                value={"\u20A6150, 000"}
              />
              <DetailStat label="KYC Status" value="Approved" />
              {owner.businessType !== "Buyer" ? (
                <DetailStat label="Products Listed" value={owner.productsListed} />
              ) : null}
              <DetailStat label="Business Type" value={owner.businessType} />
              <div className="min-w-0 md:min-w-[120px]">
                <p className="text-xs text-[#6B7280]">KYC status</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#13A83B]">
                  ID Verified <CheckCircle2 size={14} />
                </span>
              </div>
            </div>
          </div>

          <nav className="flex overflow-x-auto border-t border-[#F3F4F6]">
            {tabs.map((tab) => {
              const isActive = tab.label === activeTab;
              return (
                <Link
                  key={tab.label}
                  href={tab.href(owner.id)}
                  className={`${isActive ? "flex" : "hidden md:flex"} min-h-[56px] w-full min-w-0 flex-1 items-center justify-center px-4 text-sm transition md:min-w-[160px] ${
                    isActive
                      ? "bg-[#0669D9] text-white"
                      : "bg-white text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </section>

        {children}
      </main>
    </ProtectedRoute>
  );
}
