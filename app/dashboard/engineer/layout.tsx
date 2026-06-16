"use client";

import { DashboardLayout } from "@/components/layout";

import { engineerDashboardLinks } from "../component/dashboard-config";

export default function EngineerRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout
      logo="/images/Logo.png"
      links={engineerDashboardLinks}
      baseUrl="engineer"
      background="plain"
      linkClass="darkBordered"
      textColor="text-[#111827]"
      sidebarSurfaceClassName="bg-[#E6F4FF]"
      sidebarNavClassName="h-[calc(100vh-100px)] space-y-4 pt-12 pb-8"
    >
      {children}
    </DashboardLayout>
  );
}
