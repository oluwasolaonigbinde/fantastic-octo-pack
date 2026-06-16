"use client";

import Link from "next/link";
import { Info, X } from "lucide-react";

const STORAGE_KYC = "distributor_overview_alert_kyc_dismissed";
const STORAGE_SUB = "distributor_overview_alert_sub_dismissed";

export function readAlertDismissals(): { kyc: boolean; subscription: boolean } {
  if (typeof window === "undefined") {
    return { kyc: false, subscription: false };
  }
  return {
    kyc: window.localStorage.getItem(STORAGE_KYC) === "1",
    subscription: window.localStorage.getItem(STORAGE_SUB) === "1",
  };
}

export function DistributorOverviewAlerts({
  kycVisible,
  subscriptionVisible,
  onDismissKyc,
  onDismissSubscription,
}: {
  kycVisible: boolean;
  subscriptionVisible: boolean;
  onDismissKyc: () => void;
  onDismissSubscription: () => void;
}) {
  if (!kycVisible && !subscriptionVisible) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {kycVisible && (
        <div
          className="flex items-center gap-2.5 rounded-xl border border-[#FFE7D4] bg-[#FFFBF8] px-2.5 py-3"
          role="region"
          aria-label="KYC upgrade notice"
        >
          <Info className="size-5 shrink-0 text-[#FE6E00]" aria-hidden />
          <p className="min-w-0 flex-1 font-[family-name:var(--font-prompt,ui-sans-serif)] text-sm leading-6 text-[#111827]">
            <span>Upgrade your KYC level. </span>
            <Link
              href="/dashboard/distributor/kyc-verification"
              className="font-medium text-[#FE6E00] underline-offset-2 hover:underline"
            >
              Click here to upgrade.
            </Link>
          </p>
          <button
            type="button"
            aria-label="Dismiss KYC notice"
            onClick={() => {
              try {
                window.localStorage.setItem(STORAGE_KYC, "1");
              } catch {
                /* ignore */
              }
              onDismissKyc();
            }}
            className="shrink-0 rounded p-1 text-gray3 hover:bg-black/5 hover:text-gray1"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
      {subscriptionVisible && (
        <div
          className="flex items-center gap-2.5 rounded-xl border border-[#FFE7D4] bg-[#FFFBF8] px-2.5 py-3"
          role="region"
          aria-label="Subscription notice"
        >
          <Info className="size-5 shrink-0 text-[#FE6E00]" aria-hidden />
          <p className="min-w-0 flex-1 font-[family-name:var(--font-prompt,ui-sans-serif)] text-sm leading-6 text-[#111827]">
            <span>Update your subscription badge.</span>
            <Link
              href="/dashboard/distributor/subscriptions"
              className="font-medium text-[#FE6E00] underline-offset-2 hover:underline"
            >
              {" "}
              Click here to upgrade
            </Link>
          </p>
          <button
            type="button"
            aria-label="Dismiss subscription notice"
            onClick={() => {
              try {
                window.localStorage.setItem(STORAGE_SUB, "1");
              } catch {
                /* ignore */
              }
              onDismissSubscription();
            }}
            className="shrink-0 rounded p-1 text-gray3 hover:bg-black/5 hover:text-gray1"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
