"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { EmptyState, Spinner } from "@/components/base";
import { UserRole } from "@/types/user";
import BuyerServiceRequestForm from "../_components/buyer-service-request-form";

function RequestServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const engineerId = searchParams.get("engineerId")?.trim();

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-3 md:p-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/buyer/service-engineers")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowLeft className="size-4" />
        Go Back
      </button>

      <div className="mx-auto max-w-[820px]">
        {engineerId ? (
          <BuyerServiceRequestForm engineerId={engineerId} />
        ) : (
          <EmptyState
            title="No engineer selected"
            description="Choose a service engineer to request a service."
          />
        )}
      </div>
    </div>
  );
}

export default function BuyerRequestServicePage() {
  return (
    <ProtectedRoute requiredRole={UserRole.BUYER}>
      <div>
        <Header
          title="Request Service"
          description="Request a service from this engineer"
        />
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <RequestServiceContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
