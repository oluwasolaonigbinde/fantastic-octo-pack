"use client";

import { DashboardLayout } from "@/components/layout";

import { agentDashboardLinks } from "../component/dashboard-config";

export default function AgentRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout
      logo="/images/Logo.png"
      links={agentDashboardLinks}
      baseUrl="agent"
      background="plain"
      linkClass="light"
      contentClassName="relative w-full bg-[#F9FAFB]"
      showBackToWebsite={false}
      showLogout={true}
    >
      {children}
    </DashboardLayout>
  );
}
