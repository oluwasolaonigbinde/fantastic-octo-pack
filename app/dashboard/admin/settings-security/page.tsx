"use client";

import { useState } from "react";
import {
  FileText,
  Filter,
  Lock,
  SlidersHorizontal,
  Smartphone,
  Shield,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, SingleSelect } from "@/components/base";
import { Switch } from "@/components/base";

type SubTab = "security" | "audit" | "preferences";

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: "security", label: "System Security Settings", icon: <Shield size={18} /> },
  { key: "audit", label: "Audit Logs", icon: <FileText size={18} /> },
  { key: "preferences", label: "Preferences", icon: <SlidersHorizontal size={18} /> },
];

const AUDIT_TODAY = Array.from({ length: 4 }).map((_, i) => ({
  id: `today-${i + 1}`,
  action: "Verifying onboarding request",
  user: "Oluwatunma Olujobi",
  date: "29/09/2025 - 01:00pm",
  ip: "Successful",
}));

const AUDIT_YESTERDAY = Array.from({ length: 4 }).map((_, i) => ({
  id: `yest-${i + 1}`,
  action: "Verifying onboarding request",
  user: "Oluwatunma Olujobi",
  date: "28/09/2025 - 03:10pm",
  ip: "Successful",
}));

function SecurityContent() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [method, setMethod] = useState<"app" | "sms">("app");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="medium3 text-gray1">System Security Settings</h2>
        <p className="mt-1 text-sm text-gray3">
          Setup and update your system security settings
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray5 p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray1">
            Two-Factor authentication
          </h3>
          <p className="mt-0.5 text-xs text-gray3">
            Use a 2FA factor for an extra layer of security.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray3">Enable 2FA</span>
          <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("app")}
          className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
            method === "app"
              ? "border-primary bg-primary/5"
              : "border-gray5 bg-white"
          }`}
        >
          <Lock size={20} className="text-primary" />
          <div>
            <p className="text-sm font-semibold text-gray1">Authenticator App</p>
            <p className="text-xs text-gray3">How it works</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMethod("sms")}
          className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
            method === "sms"
              ? "border-primary bg-primary/5"
              : "border-gray5 bg-white"
          }`}
        >
          <Smartphone size={20} className="text-gray3" />
          <div>
            <p className="text-sm font-semibold text-gray1">SMS Verification</p>
            <p className="text-xs text-gray3">How it works</p>
          </div>
        </button>
      </div>

      <Button title="Setup 2FA" className="w-auto" type="button" />
    </div>
  );
}

function AuditContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="medium3 text-gray1">Audit Logs</h2>
        <p className="mt-1 text-sm text-gray3">
          See all activities on this platform
        </p>
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
        Filter audit logs by:
      </p>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_auto]">
        <Input label="User's name" placeholder="Enter user name" />
        <Input label="Date" type="date" />
        <Button
          title="Filter"
          iconLeft={<Filter size={16} />}
          className="self-end"
          type="button"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray1">
          Today - Monday 29th September 2025
        </h3>
        <div className="mt-3 space-y-3">
          {AUDIT_TODAY.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-4 gap-4 border-b border-gray5 pb-3 text-sm last:border-0"
            >
              <span className="text-gray2">{entry.action}</span>
              <span className="text-gray1">{entry.user}</span>
              <span className="whitespace-nowrap text-gray3">{entry.date}</span>
              <span className="text-success">{entry.ip}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray1">
          Yesterday - Sunday 28th September 2025
        </h3>
        <div className="mt-3 space-y-3">
          {AUDIT_YESTERDAY.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-4 gap-4 border-b border-gray5 pb-3 text-sm last:border-0"
            >
              <span className="text-gray2">{entry.action}</span>
              <span className="text-gray1">{entry.user}</span>
              <span className="whitespace-nowrap text-gray3">{entry.date}</span>
              <span className="text-success">{entry.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ mode }: { mode: "light" | "dark" | "system" }) {
  const isDark = mode === "dark";

  return (
    <div
      className={`relative h-[160px] w-full overflow-hidden rounded-xl border border-[#EEF1F5] ${
        isDark ? "bg-[#121827]" : "bg-[#FAFBFC]"
      }`}
    >
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className={`h-1.5 w-5 rounded-full ${isDark ? "bg-white/80" : "bg-[#111827]"}`} />
        <span className={`h-1.5 w-10 rounded-full ${isDark ? "bg-white/40" : "bg-[#D5DBE5]"}`} />
      </div>
      <div className="absolute left-4 top-10 flex w-[56px] flex-col gap-3">
        <span className={`h-2 rounded-full ${isDark ? "bg-white/65" : "bg-[#B8C0CC]"}`} />
        <span className={`h-2 rounded-full ${isDark ? "bg-white/55" : "bg-[#B8C0CC]"}`} />
        <span className={`h-2 rounded-full ${isDark ? "bg-white/45" : "bg-[#B8C0CC]"}`} />
        <span className={`mt-6 h-2 rounded-full ${isDark ? "bg-white/35" : "bg-[#B8C0CC]"}`} />
      </div>
      <div
        className={`absolute left-[82px] top-16 h-[116px] w-[160px] rounded-md border ${
          isDark
            ? "border-[#707788] bg-[#7B8291]"
            : mode === "system"
              ? "border-[#9CA3AF] bg-[#C5CAD3]"
              : "border-[#EEF1F5] bg-white"
        }`}
      />
      {mode === "system" ? (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-[#121827]/75" />
      ) : null}
    </div>
  );
}

function PreferencesContent() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray5 bg-white px-4 py-5">
        <h2 className="medium3 text-gray1">Preference</h2>
        <p className="mt-1 text-sm text-gray3">
          Make changes to your system preferences
        </p>
      </section>

      <section className="rounded-2xl border border-gray5 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray1">Theme</h3>
        <p className="mt-1 text-xs text-gray3">
          Change the appearance of your application by selecting your most
          preferred theme - Light, Dark or System default for a more
          personalised look and feel
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(
            [
              ["light", "Light mode"],
              ["dark", "Dark mode"],
              ["system", "System default mode"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`flex flex-col gap-3 rounded-2xl border-2 p-4 transition ${
                theme === key
                  ? "border-primary bg-primary/5"
                  : "border-gray5 bg-white"
              }`}
            >
              <ThemePreview mode={key} />
              <div className="flex items-center gap-2">
                <span
                  className={`size-4 rounded-full border-2 ${
                    theme === key
                      ? "border-primary bg-primary"
                      : "border-gray5 bg-white"
                  }`}
                />
                <span className="text-sm text-gray1">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <SingleSelect
          label="Time zone setting"
          value="wat"
          onValueChange={() => {}}
          options={[{ value: "wat", label: "UTC (+01:00) West Africa Stand..." }]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <SingleSelect
          label="Language Selection"
          value="en"
          onValueChange={() => {}}
          options={[{ value: "en", label: "English (US)" }]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <SingleSelect
          label="Default landing page"
          value="dashboard"
          onValueChange={() => {}}
          options={[{ value: "dashboard", label: "Dashboard" }]}
        />
      </div>
    </div>
  );
}

export default function AdminSettingsSecurityPage() {
  const [subTab, setSubTab] = useState<SubTab>("security");

  return (
    <div>
      <Header
        title="Settings & Security"
        description="Make updates, tweaks and changes to your account"
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="card rounded-2xl">
              <ul className="space-y-2">
                {SUB_TABS.map((tab) => {
                  const isActive = subTab === tab.key;

                  return (
                    <li key={tab.key}>
                      <button
                        type="button"
                        onClick={() => setSubTab(tab.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                          isActive
                            ? "bg-primary-light font-semibold text-primary-dark"
                            : "text-gray2 hover:bg-primary/5 hover:text-primary"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            {subTab === "security" && <SecurityContent />}
            {subTab === "audit" && <AuditContent />}
            {subTab === "preferences" && <PreferencesContent />}
          </div>
        </div>
      </div>
    </div>
  );
}
