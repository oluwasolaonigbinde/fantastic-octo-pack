"use client";

import { useState } from "react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

import {
  BuyerServiceRequestCards,
  BuyerServiceRequestKpiStrip,
  BuyerServiceRequestsFilterPanel,
  BuyerServiceRequestsQuickLinks,
} from "../_components/buyer-service-requests-content";

export default function BuyerServiceRequestPage() {
  const [requestIdFilter, setRequestIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const scrollToRequests = () => {
    document
      .getElementById("engineer-requests")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUYER}>
      <div>
        <Header
          title="Service Requests"
          description="View all service requests"
        />

        <div className="min-h-[calc(100vh-100px)] space-y-8 p-3 md:p-6">
          <BuyerServiceRequestKpiStrip />
          <BuyerServiceRequestsQuickLinks />
          <div className="rounded-3xl border border-[#E6ECF2] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <BuyerServiceRequestsFilterPanel
              requestIdFilter={requestIdFilter}
              statusFilter={statusFilter}
              dateFilter={dateFilter}
              onRequestIdChange={setRequestIdFilter}
              onStatusChange={setStatusFilter}
              onDateChange={setDateFilter}
              onFilter={scrollToRequests}
              onReset={() => {
                setRequestIdFilter("");
                setStatusFilter("");
                setDateFilter("");
              }}
            />
            <BuyerServiceRequestCards
              requestIdFilter={requestIdFilter}
              statusFilter={statusFilter}
              dateFilter={dateFilter}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
