"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bell, LockKeyhole, User } from "lucide-react";

import Header from "../../component/header";
import { SingleSelect } from "@/components/base";

import NotificationSettings from "../settings/notificationsettings";
import PasswordUpdate from "./passwordupdate";
import PersonalDetails from "./personaldetails";

type TabId = "personal" | "password" | "notifications";

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "personal", label: "Personal information", icon: <User size={18} /> },
  { id: "password", label: "Password update", icon: <LockKeyhole size={18} /> },
  { id: "notifications", label: "Notification settings", icon: <Bell size={18} /> },
];

export default function OemProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  return (
    <div>
      <Header title="Profile" description="View and update your profile information" />

      <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
        <section className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
          <h2 className="text-[32px] font-semibold text-gray1">My Profile</h2>
          <p className="text-sm text-gray2">
            View and update your profile, and change your password.
          </p>
        </section>

        <div className="block lg:hidden">
          <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-4 shadow-sm">
            <SingleSelect
              label=""
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabId)}
              options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            />
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="hidden rounded-[24px] border border-[#E8ECF4] bg-white p-4 shadow-sm lg:block">
            <ul className="space-y-4">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base transition ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-gray2 hover:text-primary"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            {activeTab === "personal" ? <PersonalDetails /> : null}
            {activeTab === "password" ? <PasswordUpdate /> : null}
            {activeTab === "notifications" ? <NotificationSettings /> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
