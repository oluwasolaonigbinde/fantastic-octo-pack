"use client";

import { useState } from "react";
import {
  Lock,
  SlidersHorizontal,
  Smartphone,
  Shield,
  Wallet,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, Skeleton } from "@/components/base";
import { Switch } from "@/components/base";
import {
  useAdminPlatformSettingsQuery,
  useUpdateAdminPlatformSettingsMutation,
} from "@/hooks/queries/admin";

type SubTab = "security" | "preferences" | "platform";

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: "security", label: "System Security Settings", icon: <Shield size={18} /> },
  { key: "platform", label: "Platform Settings", icon: <Wallet size={18} /> },
  { key: "preferences", label: "Preferences", icon: <SlidersHorizontal size={18} /> },
];

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
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
                theme === key
                  ? "border-primary bg-white"
                  : "border-gray5 bg-white"
              }`}
            >
              <ThemePreview mode={key} />
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-4 items-center justify-center rounded-full border ${
                    theme === key
                      ? "border-primary bg-white"
                      : "border-gray5 bg-white"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      theme === key ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                </span>
                <span className="text-sm text-gray1">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlatformSettingsContent() {
  const { data: settings, isLoading, isError } = useAdminPlatformSettingsQuery();
  const updateMutation = useUpdateAdminPlatformSettingsMutation();

  const [platformFeePercent, setPlatformFeePercent] = useState("");
  const [platformFeeCap, setPlatformFeeCap] = useState("");
  const [autoReceiveDays, setAutoReceiveDays] = useState("");
  const [autoReceiveEnabled, setAutoReceiveEnabled] = useState(true);
  const [subscriptionBillingEnabled, setSubscriptionBillingEnabled] =
    useState(true);
  const [subscriptionGraceDays, setSubscriptionGraceDays] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Seed the form once the settings load (render-time sync, avoids a
  // setState-in-effect for a value that only changes on first fetch).
  const [seeded, setSeeded] = useState(false);
  if (settings && !seeded) {
    setSeeded(true);
    setPlatformFeePercent(String(settings.platformFeePercent));
    setPlatformFeeCap(
      settings.platformFeeCap === null ? "" : String(settings.platformFeeCap)
    );
    setAutoReceiveDays(String(settings.autoReceiveDays));
    setAutoReceiveEnabled(settings.autoReceiveEnabled);
    setSubscriptionBillingEnabled(settings.subscriptionBillingEnabled);
    setSubscriptionGraceDays(String(settings.subscriptionGraceDays));
  }

  const handleSave = async () => {
    setError("");
    setNotice("");

    const feePercent = Number(platformFeePercent);
    const receiveDays = Number(autoReceiveDays);
    const graceDays = Number(subscriptionGraceDays);

    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      setError("Platform fee percent must be between 0 and 100.");
      return;
    }
    if (!Number.isFinite(receiveDays) || receiveDays < 1) {
      setError("Auto-receive window must be at least 1 day.");
      return;
    }
    if (!Number.isFinite(graceDays) || graceDays < 0) {
      setError("Subscription grace period can't be negative.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        platformFeePercent: feePercent,
        platformFeeCap: platformFeeCap.trim() === "" ? null : Number(platformFeeCap),
        autoReceiveDays: receiveDays,
        autoReceiveEnabled,
        subscriptionBillingEnabled,
        subscriptionGraceDays: graceDays,
      });
      setNotice("Platform settings updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update platform settings."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-gray5 bg-white p-10 text-center text-sm text-gray3">
        We couldn&apos;t load the platform settings. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="medium3 text-gray1">Platform Settings</h2>
        <p className="mt-1 text-sm text-gray3">
          Configure platform fees, auto-receive windows and subscription
          billing behaviour
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm text-[#1D4ED8]">
          {notice}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray5 p-4">
        <h3 className="text-sm font-semibold text-gray1">Platform Fees</h3>
        <p className="mt-0.5 text-xs text-gray3">
          Commission applied on each released order.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Platform fee (%)"
            type="number"
            min={0}
            max={100}
            value={platformFeePercent}
            onValueChange={setPlatformFeePercent}
          />
          <Input
            label="Fee cap (kobo, optional)"
            type="number"
            min={0}
            placeholder="No cap"
            value={platformFeeCap}
            onValueChange={setPlatformFeeCap}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray1">Auto-Receive</h3>
            <p className="mt-0.5 text-xs text-gray3">
              Automatically mark unconfirmed orders as received.
            </p>
          </div>
          <Switch
            checked={autoReceiveEnabled}
            onCheckedChange={setAutoReceiveEnabled}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Auto-receive window (days)"
            type="number"
            min={1}
            value={autoReceiveDays}
            onValueChange={setAutoReceiveDays}
            disabled={!autoReceiveEnabled}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray1">
              Subscription Billing
            </h3>
            <p className="mt-0.5 text-xs text-gray3">
              Master switch for the subscription billing background job.
            </p>
          </div>
          <Switch
            checked={subscriptionBillingEnabled}
            onCheckedChange={setSubscriptionBillingEnabled}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Past-due grace period (days)"
            type="number"
            min={0}
            value={subscriptionGraceDays}
            onValueChange={setSubscriptionGraceDays}
            disabled={!subscriptionBillingEnabled}
          />
        </div>
      </div>

      <Button
        title="Save Changes"
        className="w-auto"
        type="button"
        isBusy={updateMutation.isPending}
        disabled={updateMutation.isPending}
        onClick={() => void handleSave()}
      />
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
                            ? "font-semibold text-primary"
                            : "text-gray2 hover:text-primary"
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
            {subTab === "platform" && <PlatformSettingsContent />}
            {subTab === "preferences" && <PreferencesContent />}
          </div>
        </div>
      </div>
    </div>
  );
}
