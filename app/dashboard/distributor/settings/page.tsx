"use client";

import React, { useState } from "react";
import Header from "../../component/header";
import { Bell, CircleDollarSign, ShieldCheck } from "lucide-react";
import { SystemSettings } from "@/components/customeIcons/icons";
import PriceMode from "./pricemode";
import SecuritySettings from "./securitysettings";
import NotificationSettings from "./notificationsettings";
import Preferences from "./preferences";
import { SingleSelect } from "@/components/base";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("price");

  const tabs = [
    {
      id: "price",
      title: "Price mode",
      icon: <CircleDollarSign />,
    },
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
  const getTabs = tabs.map((tab) => ({
    label: tab.title,
    value: tab.id,
  }));

  return (
    <>
      <Header
        title="System Settings"
        description="Make changes and updates to your system settings"
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 p-3">
        <div className="w-full md:hidden">
          <div className="card">
            <SingleSelect
              label=""
              value={activeTab}
              onValueChange={(val) => setActiveTab(val)}
              options={getTabs}
            />
          </div>
        </div>
        <div className="hidden md:grid col-span-1">
          <div className="card">
            <ul>
              {tabs.map((tab) => (
                <li
                  key={tab.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg ${
                    activeTab === tab.id ? "text-primary" : "hover:text-primary"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-3">
          {activeTab === "price" && <PriceMode />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "notification" && <NotificationSettings />}
          {activeTab === "preferences" && <Preferences />}
        </div>
      </div>
    </>
  );
};

export default Settings;

