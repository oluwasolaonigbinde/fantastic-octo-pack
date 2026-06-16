"use client";

import { UserRole } from "@/types/user";

import { roleProfileTabs } from "../../component/dashboard-config";
import ProfileWorkspace from "../../component/profile-workspace";

export default function BuyerProfilePage() {
  return (
    <ProfileWorkspace
      headerTitle="Buyer Dashboard"
      description="View and update your buyer profile, upload your display photo, and change your password."
      tabs={roleProfileTabs[UserRole.BUYER]}
    />
  );
}
