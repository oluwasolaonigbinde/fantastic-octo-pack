"use client";

import Link from "next/link";

import Header from "../component/header";
import {
  OverviewNoticeBanner,
} from "../component/overview-primitives";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { useEngineerServiceRequestsQuery } from "@/hooks/queries/service-requests";
import { UserRole } from "@/types/user";

import {
  EngineerDashboardJobSection,
  EngineerSummaryMetricCards,
} from "./_components/engineer-job-requests-content";
import { EngineerDashboardDesktopOverview } from "./_components/engineer-dashboard-desktop-overview";

export default function EngineerDashboardPage() {
  const { data } = useEngineerServiceRequestsQuery();
  const serviceRequests = data?.requests ?? [];

  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <Header
        title="My Dashboard"
        description="Get insight into everything happening in your account"
      />
      <main className="min-h-[calc(100vh-100px)] bg-[#FBFCFE] p-4 md:p-6">
        <section className="space-y-4 md:space-y-3">
          <OverviewNoticeBanner
            text="Update your subscription badge. Click here to upgrade."
            className="items-start py-4 leading-snug md:items-center md:py-3 md:leading-normal"
          />
          <OverviewNoticeBanner
            text="Upgrade your KYC. Click here to upgrade."
            className="items-start py-4 leading-snug md:items-center md:py-3 md:leading-normal"
          />
          <OverviewNoticeBanner
            text="Complete Profile Details. Click here to upgrade."
            className="hidden items-center py-3 leading-normal md:flex"
          />
          <EngineerSummaryMetricCards requests={serviceRequests} />
          <div className="hidden md:block">
            <Link
              href="/dashboard/engineer/profile"
              className="inline-flex h-[56px] min-w-[276px] items-center justify-center rounded-[14px] bg-primary px-8 text-[16px] font-medium text-white transition hover:opacity-95"
            >
              Complete Profile Details
            </Link>
          </div>
        </section>

        <EngineerDashboardDesktopOverview requests={serviceRequests} />

        <div className="md:hidden">
          <EngineerDashboardJobSection />
        </div>
      </main>
    </ProtectedRoute>
  );
}
