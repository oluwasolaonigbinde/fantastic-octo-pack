"use client";

import Header from "../../component/header";
import { EngineerMessagingShell } from "../_components/engineer-messaging-shell";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

export default function EngineerMessaging() {
  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header title="Messaging" description="Connect with buyers and distributors" />
        <EngineerMessagingShell />
      </div>
    </ProtectedRoute>
  );
}
