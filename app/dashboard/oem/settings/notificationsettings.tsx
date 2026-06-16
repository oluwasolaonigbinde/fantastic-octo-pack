"use client";

import { useState } from "react";

import { Button, CustomCheckbox } from "@/components/base";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type NotificationChannelState = {
  enabled: boolean;
  receiveQuote: boolean;
  updateSystemSettings: boolean;
  generalActivities: boolean;
};

/** Matches Figma default visual: all three options on; middle row uses filled-primary checkbox. */
const DEFAULT_EMAIL_STATE: NotificationChannelState = {
  enabled: true,
  receiveQuote: true,
  updateSystemSettings: true,
  generalActivities: true,
};

const DEFAULT_IN_APP_STATE: NotificationChannelState = {
  enabled: true,
  receiveQuote: true,
  updateSystemSettings: true,
  generalActivities: true,
};

type ChannelCardProps = {
  sectionId: string;
  title: string;
  description: string;
  channelState: NotificationChannelState;
  onChange: (value: NotificationChannelState) => void;
};

function ChannelCard({
  sectionId,
  title,
  description,
  channelState,
  onChange,
}: ChannelCardProps) {
  const switchId = `${sectionId}-notifications-enabled`;

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-[72px]">
      <div className="w-full shrink-0 sm:w-[179px]">
        <p className="text-base font-normal leading-6 text-[#111827]">{title}</p>
        <p className="mt-1 min-h-[57px] text-xs leading-[18px] text-[#4B5563]">{description}</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={channelState.enabled}
              onCheckedChange={(checked) => onChange({ ...channelState, enabled: checked })}
              id={switchId}
              className="h-6 w-11 min-h-6 min-w-[2.75rem] data-[state=unchecked]:bg-[#E5E7EB] [&_[data-slot=switch-thumb]]:size-5"
            />
            <label htmlFor={switchId} className="text-sm font-normal leading-5 text-[#111827]">
              On
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <CustomCheckbox
                id={`${sectionId}-receive-quote`}
                checked={channelState.receiveQuote}
                onChange={(checked) => onChange({ ...channelState, receiveQuote: checked })}
                label="Receive quote"
                appearance="outline"
              />
              <p className="pl-[28px] text-xs leading-[18px] text-[#4B5563]">
                Check on and off to include fixed price in the price mode option
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <CustomCheckbox
                id={`${sectionId}-system-update`}
                checked={channelState.updateSystemSettings}
                onChange={(checked) =>
                  onChange({ ...channelState, updateSystemSettings: checked })
                }
                label="Update system settings"
                appearance="filledPrimary"
              />
              <p className="pl-[28px] text-xs leading-[18px] text-[#4B5563]">
                Check on and off to receive notification on general activities
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <CustomCheckbox
                id={`${sectionId}-general`}
                checked={channelState.generalActivities}
                onChange={(checked) =>
                  onChange({ ...channelState, generalActivities: checked })
                }
                label="General activities"
                appearance="outline"
              />
              <p className="pl-[28px] text-xs leading-[18px] text-[#4B5563]">
                Check on and off to receive notification on general activities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NotificationSettings = () => {
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_STATE);
  const [inAppSettings, setInAppSettings] = useState(DEFAULT_IN_APP_STATE);
  const [saveMessage, setSaveMessage] = useState("");

  const handleReset = () => {
    setEmailSettings(DEFAULT_EMAIL_STATE);
    setInAppSettings(DEFAULT_IN_APP_STATE);
    setSaveMessage("Settings restored to defaults.");
  };

  const handleSave = () => {
    setSaveMessage("Changes saved.");
  };

  return (
    <div className="rounded-2xl border border-[#DDE0E5] bg-white px-6 py-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-medium leading-8 text-[#111827]">Notification Settings</h2>
          <p className="mt-0 text-sm leading-5 text-[#4B5563]">
            Get notified when any action takes place
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end sm:gap-4">
          <Button
            variant="primaryLight"
            title="Restore To Default"
            size="sm"
            onClick={handleReset}
            className={cn(
              "h-12 w-full rounded-xl border border-[#0669D9] bg-[#EAF9FF] px-4 text-sm font-normal text-[#03265C] hover:bg-[#E0F4FF] sm:w-[152px]",
            )}
          />
          <Button
            title="Save Update"
            size="sm"
            onClick={handleSave}
            className="h-12 w-full rounded-xl border-0 bg-[#0669D9] px-4 text-sm font-normal text-white hover:bg-[#0559c4] sm:w-[152px]"
          />
        </div>
      </div>

      {saveMessage ? (
        <p className="mt-4 text-sm text-[#0669D9]" role="status">
          {saveMessage}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-16">
        <ChannelCard
          sectionId="email"
          title="Email notifications"
          description="Medical Marketplace will send you email notifications for every system action"
          channelState={emailSettings}
          onChange={setEmailSettings}
        />
        <ChannelCard
          sectionId="in-app"
          title="In-app notifications"
          description="Medical Marketplace will send you in-app notifications for every system action"
          channelState={inAppSettings}
          onChange={setInAppSettings}
        />
      </div>
    </div>
  );
};

export default NotificationSettings;
