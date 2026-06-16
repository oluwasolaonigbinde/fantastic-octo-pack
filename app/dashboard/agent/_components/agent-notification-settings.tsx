"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button, Switch } from "@/components/base";

type NotificationRow = {
  id: string;
  label: string;
  description: string;
};

const NOTIFICATION_ROWS: NotificationRow[] = [
  {
    id: "new_well_added",
    label: "New well added",
    description: "Receive notification when a new well is created",
  },
  {
    id: "new_field_added",
    label: "New field added",
    description: "Receive notification when a new field is added",
  },
  {
    id: "new_project_added",
    label: "New project added",
    description: "Get notified when there is a new project added",
  },
];

function NotificationGroup({
  title,
  description,
  prefix,
}: {
  title: string;
  description: string;
  prefix: "email" | "in_app";
}) {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_ROWS.map((row) => [`${prefix}_${row.id}`, true])),
  );

  const enabled = Object.values(values).some(Boolean);
  const setAll = (checked: boolean) =>
    setValues(
      Object.fromEntries(
        NOTIFICATION_ROWS.map((row) => [`${prefix}_${row.id}`, checked]),
      ),
    );

  return (
    <section className="grid gap-6 md:grid-cols-[179px_minmax(0,342px)] md:gap-[72px]">
      <div>
        <h3 className="text-base leading-6 text-gray1">{title}</h3>
        <p className="mt-1 text-xs leading-[19px] text-gray2">{description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Switch checked={enabled} onCheckedChange={setAll} />
          <span className="text-sm leading-5 text-gray1">On</span>
        </div>

        <div className="space-y-3">
          {NOTIFICATION_ROWS.map((row) => {
            const id = `${prefix}_${row.id}`;
            const checked = values[id] ?? false;

            return (
              <label key={id} className="block cursor-pointer">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-gray5 text-transparent"
                    }`}
                  >
                    <Check size={12} />
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [id]: event.target.checked,
                      }))
                    }
                    className="sr-only"
                  />
                  <span className="text-sm leading-5 text-gray1">{row.label}</span>
                </span>
                <span className="ml-7 block text-xs leading-5 text-gray2">
                  {row.description}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AgentNotificationSettings() {
  const [saveMessage, setSaveMessage] = useState("");

  return (
    <div className="min-h-[650px] rounded-[12px] border border-gray5 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
            onClick={() => setSaveMessage("Settings restored to defaults.")}
          />
          <Button
            title="Save Update"
            className="h-12 rounded-[12px] text-sm"
            type="button"
            onClick={() => setSaveMessage("Changes saved.")}
          />
        </div>
      </div>

      {saveMessage ? (
        <p className="mt-4 text-sm text-primary" role="status">
          {saveMessage}
        </p>
      ) : null}

      <div className="mt-10 space-y-14">
        <NotificationGroup
          title="Email notifications"
          description="We will send you an email notifications for every system action"
          prefix="email"
        />
        <NotificationGroup
          title="In-app notifications"
          description="We will send you an in-app notifications for every system action"
          prefix="in_app"
        />
      </div>
    </div>
  );
}
