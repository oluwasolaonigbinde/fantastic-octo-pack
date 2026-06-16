"use client";

import BuyerDashboard from "./BuyerDashboard";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

export default function BuyerDashboardPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.BUYER}>
      <BuyerDashboard />
    </ProtectedRoute>
  );
}
