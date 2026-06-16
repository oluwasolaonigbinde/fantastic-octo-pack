"use client";

import { useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";

import Header from "../../component/header";
import { SingleSelect } from "@/components/base";
import { SystemSettings } from "@/components/customeIcons/icons";

import SecuritySettings from "./securitysettings";
import NotificationSettings from "./notificationsettings";
import Preferences from "./preferences";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("preferences");

  const tabs = [
    {
      id: "security",
      title: "Security settings",
      icon: <ShieldCheck />,
    },
    {
      id: "notification",
      title: "Notification settings",
      icon: <Bell />,
    },
    {
      id: "preferences",
      title: "Preferences",
      icon: <SystemSettings />,
    },
  ];

  const selectTabs = tabs.map((tab) => ({
    label: tab.title,
    value: tab.id,
  }));

  return (
    <>
      <Header
        title="System Settings"
        description="Manage security, notifications, and preferences for your workspace."
      />

      <div className="grid gap-4 bg-[#F5F7FB] p-4 md:p-6 lg:grid-cols-[minmax(220px,280px)_1fr] lg:gap-6">
        <div className="w-full lg:hidden">
          <div className="rounded-2xl border border-[#DDE0E5] bg-white p-4 shadow-sm">
            <SingleSelect
              label=""
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              options={selectTabs}
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <nav
            className="h-[445px] rounded-2xl border border-[#DDE0E5] bg-white px-5 py-8 shadow-sm"
            aria-label="System settings sections"
          >
            <ul className="flex flex-col gap-10">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 text-left text-base font-normal leading-6 transition-colors ${
                        isActive ? "text-[#0669D9]" : "text-[#111827] hover:text-[#0669D9]"
                      }`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center [&>svg]:size-6 ${
                          isActive ? "text-[#0669D9]" : "text-[#111827]"
                        }`}
                      >
                        {tab.icon}
                      </span>
                      {tab.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div>
          {activeTab === "security" ? <SecuritySettings /> : null}
          {activeTab === "notification" ? <NotificationSettings /> : null}
          {activeTab === "preferences" ? <Preferences /> : null}
        </div>
      </div>
    </>
  );
};

export default Settings;
