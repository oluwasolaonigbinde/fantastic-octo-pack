"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type {
  agentPendingTasks,
  agentRecentActivities,
  agentTopBusinesses,
} from "../mockdata";

interface PendingTasksProps {
  tasks: typeof agentPendingTasks;
}

export function AgentPendingTasks({ tasks }: PendingTasksProps) {
  return (
    <div className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
      <p className="mb-1 text-lg font-semibold text-[#111827]">Pending Tasks</p>
      <p className="mb-5 text-sm text-[#374151]">Tasks waiting your attention</p>
      <ul className="space-y-4 md:space-y-5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#E4E7EC] px-4 py-3 md:min-h-[78px] md:px-6"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#017BED]" />
              <span>
                <span className="block text-sm text-[#111827] md:text-base">
                  {task.text}
                </span>
                <span className="mt-1 block text-xs text-[#6B7280]">3 items</span>
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-[#0669D9]"
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RecentActivitiesProps {
  activities: typeof agentRecentActivities;
}

export function AgentRecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
      <p className="mb-1 text-lg font-semibold text-[#111827]">Recent Activities</p>
      <p className="mb-5 text-sm text-[#374151]">Recent updates</p>
      <ul className="space-y-4 md:space-y-5">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#E4E7EC] px-4 py-3 md:min-h-[78px] md:px-6"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#017BED]" />
              <span>
                <span className="block text-sm text-[#111827] md:text-base">
                  {activity.text}
                </span>
                <span className="mt-1 block text-xs text-[#6B7280]">
                  12/01/26  |  08:20 am
                </span>
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-[#0669D9]"
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface TopBusinessesProps {
  businesses: typeof agentTopBusinesses;
}

export function AgentTopBusinesses({ businesses }: TopBusinessesProps) {
  return (
    <div className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
      <p className="mb-6 text-lg font-semibold text-[#111827]">Top Active Businesses</p>
      <ul className="space-y-3 md:space-y-4">
        {businesses.map((biz) => (
          <li
            key={biz.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#E4E7EC] px-4 py-4"
          >
            <div className="flex items-center gap-4">
              <span className="size-10 rounded-lg border border-[#DDE0E5] bg-[repeating-linear-gradient(45deg,#F3F4F6_0,#F3F4F6_3px,#E5E7EB_3px,#E5E7EB_6px)] md:size-12" />
              <div>
                <p className="text-sm font-medium text-[#111827] md:text-base">
                  {biz.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  <span className="inline md:hidden">Verified seller&nbsp;&nbsp;</span>
                  <span className="hidden md:inline">Verified seller&nbsp;&nbsp;</span>
                  {biz.email}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/agent/business-owners/${biz.id}`}
              className="shrink-0 text-sm font-medium text-[#0669D9]"
              aria-label={`View ${biz.name}`}
            >
              <span className="md:hidden">View</span>
              <ArrowRight size={18} className="hidden md:block" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
