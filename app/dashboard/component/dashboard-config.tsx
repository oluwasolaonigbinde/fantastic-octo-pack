"use client";

import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Briefcase,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  LockKeyhole,
  MessageCircleMore,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Vault,
  Wallet,
  Wrench,
} from "lucide-react";

import type { DashboardLink } from "@/components/layout";
import { ListingRequest, SystemSettings } from "@/components/customeIcons/icons";
import { UserRole } from "@/types/user";

export interface RoleProfileTab {
  id: "personal" | "password" | "notifications" | "payment" | "engineering";
  title: string;
  icon: ReactNode;
  disabled?: boolean;
}

export const knownDashboardRoleSegments = new Set<string>([
  UserRole.BUYER,
  UserRole.DISTRIBUTOR,
  UserRole.OEM,
  UserRole.ENGINEER,
  UserRole.ADMIN,
  UserRole.AGENT,
  UserRole.SUPER_ADMIN,
]);

export const buyerDashboardLinks: DashboardLink[] = [
  { name: "Dashboard", path: "", icon: <LayoutGrid /> },
  { name: "RFQs", path: "rfqs", icon: <ClipboardList /> },
  {
    name: "Service Request",
    path: "service-request",
    icon: <Wrench />,
  },
  {
    name: "KYC Verification",
    path: "kyc-verification",
    icon: <ShieldCheck />,
  },
  {
    name: "Wallet & Payment",
    path: "payments",
    icon: <Wallet />,
  },
  {
    name: "Messages",
    path: "messages",
    icon: <MessageCircleMore />,
  },
  {
    name: "Orders",
    path: "orders",
    icon: <ShoppingBag />,
  },
];

export const distributorDashboardLinks: DashboardLink[] = [
  { name: "Dashboard", path: "", icon: <LayoutGrid /> },
  {
    name: "My Catalogue",
    path: "catalogue",
    icon: <Package />,
  },
  {
    name: "KYC Verification",
    path: "kyc-verification",
    icon: <ShieldCheck />,
  },
  {
    name: "Subscriptions",
    path: "subscriptions",
    icon: <CreditCard />,
  },
  {
    name: "Sourcing & Quoting",
    path: "quotes",
    icon: <ClipboardList />,
  },
  {
    name: "Orders",
    path: "orders",
    icon: <ShoppingBag />,
  },
  {
    name: "Wallets & Payment",
    path: "payments",
    icon: <Wallet />,
  },
  {
    name: "Messaging",
    path: "message",
    icon: <MessageCircleMore />,
  },
  {
    name: "System Settings",
    path: "settings",
    icon: <SystemSettings />,
  },
  {
    name: "Store",
    path: "store",
    icon: <Store />,
  },
];

export const oemDashboardLinks: DashboardLink[] = [
  { name: "User Management", path: "", icon: <LayoutGrid /> },
  {
    name: "Distributors",
    path: "distributors",
    icon: <Package />,
  },
  {
    name: "product mapping",
    path: "requests",
    icon: <ListingRequest />,
  },
  {
    name: "System Setting",
    path: "settings",
    icon: <SystemSettings />,
  },
  {
    name: "KYC Verification",
    path: "kyc-verification",
    icon: <ShieldCheck />,
  },
  {
    name: "Subscription",
    path: "subscription",
    icon: <CreditCard />,
  },
  {
    name: "Messaging",
    path: "messaging",
    icon: <MessageCircleMore />,
  },
];

export const engineerDashboardLinks: DashboardLink[] = [
  { name: "Dashboard", path: "", icon: <LayoutGrid /> },
  {
    name: "Job Requests",
    path: "job-requests",
    icon: <Wrench />,
  },
  {
    name: "Wallet",
    path: "wallet",
    icon: <Wallet />,
  },
  {
    name: "Messaging",
    path: "messaging",
    icon: <MessageCircleMore />,
  },
  {
    name: "KYC Verification",
    path: "kyc-verification",
    icon: <ShieldCheck />,
  },
  {
    name: "Subscription",
    path: "subscription",
    icon: <CreditCard />,
  },
];

export const agentDashboardLinks: DashboardLink[] = [
  { name: "Dashboard", path: "", icon: <LayoutGrid /> },
  {
    name: "Business Owners",
    path: "business-owners",
    icon: <Briefcase />,
  },
  {
    name: "Orders",
    path: "orders",
    icon: <ShoppingBag />,
  },
  {
    name: "ESCROW",
    path: "escrow",
    icon: <Vault />,
  },
  {
    name: "Wallet & Earnings",
    path: "wallet",
    icon: <Wallet />,
  },
  {
    name: "Training & Courses",
    path: "training",
    icon: <BookOpen />,
  },
];

export const roleProfileTabs: Record<
  UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER | UserRole.AGENT,
  RoleProfileTab[]
> = {
  [UserRole.BUYER]: [
    { id: "personal", title: "Personal information", icon: <User /> },
    { id: "password", title: "Password update", icon: <LockKeyhole /> },
    {
      id: "notifications",
      title: "Notification settings",
      icon: <Bell />,
      disabled: true,
    },
    {
      id: "payment",
      title: "Payment method",
      icon: <CreditCard />,
      disabled: true,
    },
  ],
  [UserRole.DISTRIBUTOR]: [
    { id: "personal", title: "Personal information", icon: <User /> },
    { id: "password", title: "Password update", icon: <LockKeyhole /> },
  ],
  [UserRole.OEM]: [
    { id: "personal", title: "Personal information", icon: <User /> },
    { id: "password", title: "Password update", icon: <LockKeyhole /> },
    {
      id: "notifications",
      title: "Notification settings",
      icon: <Bell />,
    },
  ],
  [UserRole.ENGINEER]: [
    { id: "personal", title: "Personal information", icon: <User /> },
    { id: "engineering", title: "About Engineering", icon: <Wrench /> },
    { id: "password", title: "Password update", icon: <LockKeyhole /> },
    {
      id: "notifications",
      title: "Notification settings",
      icon: <Bell />,
      disabled: true,
    },
  ],
  [UserRole.AGENT]: [
    { id: "personal", title: "Personal information", icon: <User /> },
    { id: "password", title: "Password update", icon: <LockKeyhole /> },
    { id: "notifications", title: "Notification settings", icon: <Bell /> },
  ],
};
