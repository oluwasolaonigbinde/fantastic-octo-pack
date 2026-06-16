"use client";

import { DashboardLayout } from "@/components/layout";

import { distributorDashboardLinks } from "../component/dashboard-config";

export default function DistributorRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout
      logo="/images/Logo.png"
      links={distributorDashboardLinks}
      baseUrl="distributor"
      background="plain"
      linkClass="light"
      contentClassName="relative w-full bg-[#F9FAFB]"
      showLogout={false}
    >
      {children}
    </DashboardLayout>
  );
}
