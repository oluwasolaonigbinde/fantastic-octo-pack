"use client";

import { UserRole } from "@/types/user";

import { roleProfileTabs } from "../../component/dashboard-config";
import ProfileWorkspace from "../../component/profile-workspace";

export default function DistributorProfilePage() {
  return (
    <ProfileWorkspace
      headerTitle="Distributor Dashboard"
      description="View and update your distributor account profile, upload your display photo, and change your password."
      tabs={roleProfileTabs[UserRole.DISTRIBUTOR]}
    />
  );
}
