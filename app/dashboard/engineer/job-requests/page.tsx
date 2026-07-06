"use client";

import { useState } from "react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { useEngineerServiceRequestsQuery } from "@/hooks/queries/service-requests";
import { UserRole } from "@/types/user";

import {
  EngineerJobCards,
  EngineerJobRequestsPageFilterPanel,
  EngineerSummaryMetricCards,
} from "../_components/engineer-job-requests-content";

export default function EngineerJobRequests() {
  const { data } = useEngineerServiceRequestsQuery();
  const serviceRequests = data?.requests ?? [];
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const scrollToRequests = () => {
    document
      .getElementById("engineer-job-requests")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header
          title="Job Requests"
          description="Review and manage your incoming service requests"
        />

        <div className="min-h-[calc(100vh-100px)] space-y-5 bg-[#F5F7FA] p-4 md:space-y-4 md:p-6">
          <EngineerSummaryMetricCards requests={serviceRequests} />
          <EngineerJobRequestsPageFilterPanel
            jobTypeFilter={jobTypeFilter}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
            onJobTypeChange={setJobTypeFilter}
            onStatusChange={setStatusFilter}
            onDateChange={setDateFilter}
            onFilter={scrollToRequests}
          />
          <EngineerJobCards
            jobTypeFilter={jobTypeFilter}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
