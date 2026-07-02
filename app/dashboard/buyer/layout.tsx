"use client";

import { DashboardLayout } from "@/components/layout";

import { buyerDashboardLinks } from "../component/dashboard-config";

export default function BuyerRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout
      logo="/images/Logo.png"
      links={buyerDashboardLinks}
      baseUrl="buyer"
      textColor="text-gray1"
      background="plain"
      linkClass="darkBordered"
      sidebarSurfaceClassName="bg-[#EAF9FF] border-r border-[#BFEFFF]"
      showBackToWebsite={true}
      showLogout={true}
    >
      {children}
    </DashboardLayout>
  );
}
