"use client";

import { UserRole } from "@/types/user";

import { roleProfileTabs } from "../../component/dashboard-config";
import ProfileWorkspace from "../../component/profile-workspace";

export default function AgentProfilePage() {
  return (
    <ProfileWorkspace
      headerTitle="My Profile"
      headerDescription="View and update your profile information"
      description="View and update your profile, and change your password."
      tabs={roleProfileTabs[UserRole.AGENT]}
    />
  );
}
