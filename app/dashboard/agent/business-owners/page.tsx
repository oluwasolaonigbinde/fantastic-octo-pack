"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, Plus } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { AgentBusinessTable } from "../_components/agent-business-table";
import {
  agentDistributors,
  agentBuyers,
  agentOEMs,
  agentServiceEngineers,
} from "../mockdata";

type TabKey = "Distributors" | "Buyers" | "OEMs" | "Service Engineers";

const TABS: TabKey[] = ["Distributors", "Buyers", "OEMs", "Service Engineers"];

const tabData: Record<TabKey, { rows: typeof agentDistributors; label: string }> = {
  Distributors: { rows: agentDistributors, label: "Distributor" },
  Buyers: { rows: agentBuyers, label: "Buyer" },
  OEMs: { rows: agentOEMs, label: "OEM" },
  "Service Engineers": { rows: agentServiceEngineers, label: "Service Engineer" },
};

export default function AgentBusinessOwnersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const tabFromQuery = searchParams.get("tab") as TabKey | null;
  const activeTab = tabFromQuery && TABS.includes(tabFromQuery)
    ? tabFromQuery
    : "Distributors";

  const handleTabChange = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "Distributors") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const { rows, label } = tabData[activeTab];
  const filtered = search
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
        mobileChrome="profile"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-3 md:p-4">

        {/* Tab bar */}
        <div className="flex overflow-x-auto bg-white scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`min-h-14 shrink-0 whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors md:flex-1 ${
                activeTab === tab
                  ? "bg-[#0669D9] text-white"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
          <div className="items-start justify-between gap-4 md:flex">
            <div>
              <p className="text-3xl font-semibold text-[#111827]">20</p>
              <p className="mt-4 text-base text-[#111827]">
                Total number of businesses onboarded
              </p>
            </div>
            <Link
              href="/dashboard/agent/business-owners/new"
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#0669D9] px-8 text-base font-medium text-white md:mt-0 md:w-[250px]"
            >
              Add business <Plus size={20} />
            </Link>
          </div>

          <div className="mt-12 md:mt-14">
            <p className="mb-7 text-sm text-[#111827]">Filter&nbsp; list by:</p>
            <div className="flex flex-col gap-5 md:flex-row md:items-end">
              <div className="md:w-[320px]">
                <label className="mb-3 block text-sm text-[#111827]">
                  Name/email address
                </label>
                <input
                  type="text"
                  placeholder="Enter business name/email address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-sm text-[#111827] placeholder:text-[#C0C4CC] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-[#0669D9] px-6 text-base font-medium text-white md:w-[250px]"
              >
                <SlidersHorizontal size={18} />
                Filter
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
          <AgentBusinessTable rows={filtered} typeLabel={label} />
        </section>

      </main>
    </ProtectedRoute>
  );
}
