"use client";

import { DashboardLayout } from "@/components/layout";

import { oemDashboardLinks } from "../component/dashboard-config";

export default function OemRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout
      logo="/images/logo-light.png"
      links={oemDashboardLinks}
      baseUrl="oem"
      background="primary"
      linkClass="dark"
      sidebarSurfaceClassName="bg-[#03265C]"
      sidebarNavClassName="h-[calc(100vh-140px)] space-y-3 px-2 py-7"
    >
      {children}
    </DashboardLayout>
  );
}
