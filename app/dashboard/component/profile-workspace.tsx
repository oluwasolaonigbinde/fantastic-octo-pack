"use client";

import { lazy, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PersonalDetails from "@/app/dashboard/buyer/profile/personaldetails";
import PasswordUpdate from "@/app/dashboard/buyer/profile/passwordupdate";
import { AgentNotificationSettings } from "@/app/dashboard/agent/_components/agent-notification-settings";

import type { RoleProfileTab } from "./dashboard-config";
import Header from "./header";

const AboutEngineering = lazy(
  () => import("@/app/dashboard/engineer/_components/about-engineering")
);

interface ProfileWorkspaceProps {
  headerTitle: string;
  /** Shown under the page title in the top header (when provided). */
  headerDescription?: string;
  description: string;
  tabs: RoleProfileTab[];
}

function TabPanel({ activeTab }: { activeTab: RoleProfileTab["id"] }) {
  switch (activeTab) {
    case "password":
      return <PasswordUpdate />;
    case "notifications":
      return <AgentNotificationSettings />;
    case "engineering":
      return (
        <Suspense fallback={<div className="p-6 text-sm text-gray3">Loading...</div>}>
          <AboutEngineering />
        </Suspense>
      );
    default:
      return <PersonalDetails />;
  }
}

export default function ProfileWorkspace({
  headerTitle,
  headerDescription,
  description,
  tabs,
}: ProfileWorkspaceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const firstInteractiveTab = tabs.find((tab) => !tab.disabled);
  const fallbackTab = firstInteractiveTab?.id ?? "personal";
  const tabFromQuery = searchParams.get("tab") as RoleProfileTab["id"] | null;
  const queryTabIsAllowed = tabs.some(
    (tab) => tab.id === tabFromQuery && !tab.disabled,
  );
  const activeTab = queryTabIsAllowed && tabFromQuery ? tabFromQuery : fallbackTab;

  const handleTabChange = (tabId: RoleProfileTab["id"]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === fallbackTab) {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <Header title={headerTitle} description={headerDescription} />
      <div className="h-full space-y-3 bg-gray6 p-3">
        <div className="card h-fit">
          <h1 className="medium3">My Profile</h1>
          <p>{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="col-span-1">
            <div className="card">
              <ul className="space-y-3">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        disabled={tab.disabled}
                        aria-disabled={tab.disabled ? "true" : "false"}
                        onClick={() => {
                          if (!tab.disabled) {
                            handleTabChange(tab.id);
                          }
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                          tab.disabled
                            ? "cursor-not-allowed border border-gray5 bg-white text-gray3"
                            : isActive
                              ? "bg-primary-light text-primary-dark"
                              : "border border-transparent hover:border-primary/20 hover:text-primary"
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-3">
            <TabPanel activeTab={activeTab} />
          </div>
        </div>
      </div>
    </>
  );
}
