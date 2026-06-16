"use client";

import { useState } from "react";
import { CheckSquare, Mail } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { agentNotifications } from "../mockdata";

export default function AgentNotificationsPage() {
  const [sortBy, setSortBy] = useState("All");

  const grouped = agentNotifications.reduce<Record<string, typeof agentNotifications>>(
    (acc, n) => {
      if (!acc[n.group]) acc[n.group] = [];
      acc[n.group].push(n);
      return acc;
    },
    {},
  );

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header title="My Notifications" description="View all notifications" />
      <main className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] px-5 py-4 md:p-4">
        <div className="mb-5 rounded-[14px] bg-white px-5 py-6 md:hidden">
          <p className="text-lg font-medium text-[#111827]">All Notifications</p>
          <p className="mt-1 text-xs text-[#374151]">View all notifications</p>
        </div>

        <div className="rounded-[14px] border border-[#E9EDF3] bg-white px-3 py-5 md:rounded-[12px] md:p-5">
          <div className="mb-8 flex items-center gap-3 md:mb-8 md:justify-between">
            <p className="hidden text-lg font-medium text-[#111827] md:block">All Notifications</p>
            <div className="flex items-center gap-3">
              <span className="text-base text-[#111827] md:text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 rounded-[12px] border border-[#DDE0E5] bg-white px-4 text-sm text-[#9CA3AF] focus:outline-none md:h-12 md:w-[88px]"
              >
                <option value="All">All</option>
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
              </select>
            </div>
          </div>

          <div className="space-y-7 md:px-6">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                {/* Group header */}
                <div className="mb-3 flex items-center gap-4">
                  <CheckSquare size={20} className="text-[#111827]" />
                  <span className="text-lg font-semibold text-[#111827]">
                    <span className="md:hidden">{group === "18th November, 2025" ? "Last 7 days" : group}</span>
                    <span className="hidden md:inline">{group}</span>
                  </span>
                </div>

                <ul>
                  {items.map((n, index) => (
                    <li
                      key={n.id}
                      className={`${group === "18th November, 2025" && index > 0 ? "hidden md:flex" : "flex"} items-start gap-3 border-b border-[#EEF0F3] py-3 md:gap-4 md:py-6`}
                    >
                      <CheckSquare size={16} className="mt-0.5 shrink-0 text-[#111827] md:size-5" />
                      <Mail size={16} className="mt-0.5 shrink-0 text-[#111827] md:size-5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-[#111827]">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-[#6B7280] md:hidden">{n.dateTime}</span>
                        </div>
                        <p className="mt-2 truncate text-xs text-[#6B7280] md:mt-2 md:text-sm">{n.body}</p>
                      </div>
                      <span className="hidden shrink-0 text-xs text-[#6B7280] md:block">{n.dateTime}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </main>
    </ProtectedRoute>
  );
}
