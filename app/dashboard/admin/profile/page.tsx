"use client";

import { useState } from "react";
import PersonalDetails from "./personaldetails";
import PasswordUpdate from "./passwordupdate";
import NotificationSettings from "./notificationsettings";
import Header from "../../component/header";
import { Bell, LockKeyhole, User } from "lucide-react";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("personal");

  const tabs = [
    {
      id: "personal",
      title: "Personal information",
      icon: <User />,
    },
    {
      id: "notifications",
      title: "Notification settings",
      icon: <Bell />,
    },
    {
      id: "account",
      title: "Account settings",
      icon: <LockKeyhole />,
    },
  ];

  return (
    <>
      <Header
        title="Profile"
        description="View and update your profile information"
      />
      <div className="min-h-screen bg-gray7 p-4">
        <div className="mx-auto max-w-[1160px] space-y-4">
        <div className="rounded-[12px] border border-gray5 bg-white px-4 py-6">
          <h1 className="text-xl font-medium leading-8 text-gray1">My Profile</h1>
          <p className="text-sm leading-5 text-gray2">
            View and update your profile, change your password and set your preferences
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[278px_minmax(0,1fr)]">
          <div className="w-full md:hidden">
            <div className="flex items-center gap-6 overflow-x-auto border-b border-gray5 bg-transparent px-1 pb-3 no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative shrink-0 whitespace-nowrap text-[15px] leading-6 transition ${
                      isActive ? "text-primary" : "text-gray1"
                    }`}
                  >
                    {tab.id === "personal"
                      ? "Personal info"
                      : tab.id === "notifications"
                        ? "Notification"
                        : "Account settings"}
                    <span
                      className={`absolute -bottom-3 left-0 h-0.5 rounded-full bg-primary transition-all ${
                        isActive ? "w-full" : "w-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="hidden w-full md:block">
            <div className="min-h-[542px] rounded-[12px] border border-gray5 bg-white p-6">
              <ul className="space-y-8">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center gap-3 text-left text-base leading-6 transition ${
                          isActive
                            ? "text-primary"
                            : "text-gray1 hover:text-primary"
                        }`}
                      >
                        <span className="[&_svg]:size-6">{tab.icon}</span>
                        <span>{tab.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="min-w-0">
            {activeTab === "personal" && <PersonalDetails />}
            {activeTab === "account" && <PasswordUpdate />}
            {activeTab === "notifications" && <NotificationSettings />}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

