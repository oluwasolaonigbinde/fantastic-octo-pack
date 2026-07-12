"use client";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

import AdminCreateJobRequestForm from "../_components/admin-create-job-request-form";

export default function AdminCreateServiceRequestPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <Header
          title="Create service request"
          description="Raise a new service request and assign it to an engineer"
        />

        <div className="p-4 md:p-6">
          <div className="mx-auto max-w-[820px]">
            <AdminCreateJobRequestForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
