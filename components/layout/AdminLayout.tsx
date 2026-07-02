"use client";

import {
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutGrid,
  MessageSquare,
  Repeat,
  ScrollText,
  Scale,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { DashboardLayout, type DashboardLink } from "./DashboardLayout";

export const adminDashLinks: DashboardLink[] = [
  {
    name: "Dashboard",
    path: "",
    icon: <LayoutGrid />,
  },
  {
    name: "Platform Users",
    path: "platform-users",
    icon: <Users />,
  },
  {
    name: "Products & Listings",
    path: "products",
    icon: <ClipboardList />,
  },
  {
    name: "Sourcing & Quoting",
    path: "rfqs-orders",
    icon: <FileText />,
  },
  {
    name: "Orders",
    path: "orders",
    icon: <ScrollText />,
  },
  {
    name: "Settings & Security",
    path: "settings-security",
    icon: <Shield />,
  },
  {
    name: "User Management",
    path: "user-management",
    icon: <User />,
  },
  {
    name: "Services",
    path: "services",
    icon: <Briefcase />,
  },
  {
    name: "Payment",
    path: "payment",
    icon: <CreditCard />,
  },
  {
    name: "Disputes",
    path: "disputes",
    icon: <Scale />,
  },
  {
    name: "Subscriptions",
    path: "subscriptions",
    icon: <Repeat />,
  },
  {
    name: "KYC Verification",
    path: "kyc-verification",
    icon: <ShieldCheck />,
  },
  {
    name: "Messaging",
    path: "messaging",
    icon: <MessageSquare />,
  },
];

const ADMIN_SIDEBAR_SURFACE =
  "bg-[#F0F8FF] border-r border-[#D4E8FC]";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      logo="/images/Logo.png"
      links={adminDashLinks}
      baseUrl="admin"
      background="plain"
      linkClass="darkBordered"
      textColor="text-gray1"
      sidebarSurfaceClassName={ADMIN_SIDEBAR_SURFACE}
      sidebarNavClassName="pt-6 space-y-3"
      showBackToWebsite={true}
      showLogout={true}
    >
      {children}
    </DashboardLayout>
  );
}
