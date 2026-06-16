"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button, Switch } from "@/components/base";

type NotificationRow = {
  id: string;
  label: string;
  description: string;
};

const EMAIL_ROWS: NotificationRow[] = [
  {
    id: "email_new_user",
    label: "New user registered",
    description: "Receive notification when a new platform user signs up",
  },
  {
    id: "email_kyc",
    label: "KYC request submitted",
    description: "Receive notification when a user submits verification",
  },
  {
    id: "email_dispute",
    label: "New dispute opened",
    description: "Get notified when a dispute needs admin attention",
  },
];

const INAPP_ROWS: NotificationRow[] = [
  {
    id: "inapp_onboarding",
    label: "Onboarding request updated",
    description: "Receive notification when onboarding status changes",
  },
  {
    id: "inapp_rfq",
    label: "RFQ activity detected",
    description: "Receive notification when RFQ activity requires review",
  },
  {
    id: "inapp_security",
    label: "Security action required",
    description: "Get notified when account security needs attention",
  },
];

function NotificationGroup({
  title,
  description,
  rows,
  values,
  onToggle,
}: {
  title: string;
  description: string;
  rows: NotificationRow[];
  values: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const groupEnabled = rows.some((row) => values[row.id]);

  return (
    <section className="grid gap-6 md:grid-cols-[179px_minmax(0,342px)] md:gap-[72px]">
      <div>
        <h3 className="text-base leading-6 text-gray1">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-gray2">{description}</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Switch
            checked={groupEnabled}
            onCheckedChange={(checked) =>
              rows.forEach((row) => onToggle(row.id, checked))
            }
          />
          <span className="text-sm leading-5 text-gray1">
            {groupEnabled ? "On" : "Off"}
          </span>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <label key={row.id} className="block cursor-pointer">
              <span className="flex items-center gap-2">
                <span
                  className={`flex size-5 items-center justify-center rounded-full border ${
                    values[row.id]
                      ? "border-primary bg-primary text-white"
                      : "border-gray5 text-transparent"
                  }`}
                >
                  <Check size={12} />
                </span>
                <input
                  type="checkbox"
                  checked={values[row.id] ?? false}
                  onChange={(event) => onToggle(row.id, event.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm leading-5 text-gray1">{row.label}</span>
              </span>
              <span className="ml-7 block text-xs leading-5 text-gray2">
                {row.description}
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function NotificationSettings() {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...EMAIL_ROWS, ...INAPP_ROWS].map((row) => [row.id, true]))
  );

  const toggle = (id: string, checked: boolean) =>
    setValues((prev) => ({ ...prev, [id]: checked }));

  const restoreToDefault = () =>
    setValues(
      Object.fromEntries([...EMAIL_ROWS, ...INAPP_ROWS].map((row) => [row.id, true]))
    );

  return (
    <div className="min-h-[650px] rounded-[12px] border border-gray5 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-medium leading-8 text-gray1">
            Notification Settings
          </h2>
          <p className="text-sm leading-5 text-gray2">
            Get notified of actions taking place.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:w-[320px]">
          <Button
            title="Restore To Default"
            variant="primaryLight"
            className="h-12 rounded-[12px] text-sm text-[#03265C]"
            type="button"
            onClick={restoreToDefault}
          />
          <Button
            title="Save Update"
            className="h-12 rounded-[12px] text-sm"
            type="button"
          />
        </div>
      </div>

      <div className="mt-10 space-y-14">
        <NotificationGroup
          title="Email notifications"
          description="We will send you email notifications for key system actions"
          rows={EMAIL_ROWS}
          values={values}
          onToggle={toggle}
        />
        <NotificationGroup
          title="In-app notifications"
          description="We will send you in-app notifications for key system actions"
          rows={INAPP_ROWS}
          values={values}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}
