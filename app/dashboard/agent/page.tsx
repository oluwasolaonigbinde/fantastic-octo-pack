"use client";

import Link from "next/link";
import { ArrowRight, Award, Eye, Plus } from "lucide-react";

import Header from "../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

import { AgentKpiGrid } from "./_components/agent-kpi-grid";
import { AgentEarningsChart } from "./_components/agent-earnings-chart";
import {
  AgentPendingTasks,
  AgentRecentActivities,
  AgentTopBusinesses,
} from "./_components/agent-dashboard-columns";
import {
  agentKpis,
  agentPendingTasks,
  agentRecentActivities,
  agentTopBusinesses,
  agentEarningsTrend,
} from "./mockdata";

export default function AgentDashboardPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Dashboard Overview"
        description="Wednesday 10th September, 2025"
        mobileChrome="dashboard"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-3 md:space-y-4 md:p-4">
        <div className="min-h-[170px] rounded-xl border border-[#F59E0B]/30 bg-[linear-gradient(105deg,#B86213_0%,#F59E0B_48%,#FFD600_100%)] px-4 py-4 text-white md:flex md:h-[154px] md:min-h-0 md:items-center md:justify-between md:px-6 md:py-5">
          <div className="space-y-3 md:space-y-5">
            <div>
              <p className="flex items-center gap-2 text-[15px] font-semibold md:text-base">
                <Award size={18} />
                Gold Level Agent
              </p>
              <p className="mt-2 text-[13px] leading-5 md:mt-3 md:text-sm">
                Congratulations! You&apos;re in the top 10% of agents. Keep it up.
              </p>
            </div>
            <div className="flex gap-5 text-[13px] md:gap-7 md:text-sm">
              <p>
                <span className="block text-white/90">Subscriptions</span>
                <span className="text-lg font-semibold">10 active</span>
              </p>
              <p>
                <span className="block text-white/90 md:hidden">Subscriptions</span>
                <span className="hidden text-white/90 md:block">ESCROW Volume</span>
                <span className="text-lg font-semibold md:hidden">10 active</span>
                <span className="hidden text-lg font-semibold md:block">₦150,000</span>
              </p>
            </div>
          </div>
          <div className="mt-3 w-[138px] md:mt-0 md:w-[170px]">
            <div className="h-3 rounded-full bg-white/25">
              <span className="block h-full w-[65%] rounded-full bg-white" />
            </div>
            <p className="mt-2 text-[13px] font-medium md:text-sm">85% to Bronze Level</p>
          </div>
        </div>

        <AgentKpiGrid
          allSavings={agentKpis.allSavings}
          availableFunds={agentKpis.availableFunds}
          pendingCommissions={agentKpis.pendingCommissions}
          businessesOnboarded={agentKpis.businessesOnboarded}
        />

        <div className="rounded-xl border border-[#DDE0E5] bg-white p-4 md:flex md:items-center md:justify-between md:gap-4 md:px-5 md:py-6">
          <div className="mb-4 md:mb-0">
            <p className="text-[17px] font-semibold text-[#111827] md:text-lg">Quick Links</p>
            <p className="text-[13px] text-[#374151] md:text-sm">What would you like to perform?</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            <Link
              href="/dashboard/agent/business-owners"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[#0669D9] px-8 text-sm font-medium text-white md:h-14 md:min-w-[250px]"
            >
              Add business <Plus size={18} />
            </Link>
            <Link
              href="/dashboard/agent/orders"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-[#FE6E00] bg-white px-8 text-sm font-medium text-[#FE6E00] md:h-14 md:min-w-[250px]"
            >
              <Eye size={18} /> View orders <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard/agent/wallet"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-[#017BED] bg-[#EFF8FF] px-8 text-sm font-medium text-[#111827] md:h-14 md:min-w-[250px]"
            >
              Payout <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AgentEarningsChart data={agentEarningsTrend} year={2025} />
          </div>
          <AgentTopBusinesses businesses={agentTopBusinesses} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <AgentPendingTasks tasks={agentPendingTasks} />
          </div>
          <div className="order-1 lg:order-2">
            <AgentRecentActivities activities={agentRecentActivities} />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
