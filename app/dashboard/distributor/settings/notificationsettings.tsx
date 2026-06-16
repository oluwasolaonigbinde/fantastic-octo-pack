"use client";

import { Button } from "@/components/base";
import { CustomCheckbox } from "@/components/base";
import { Switch } from "@/components/ui/switch";
import React, { useState } from "react";

const NotificationSettings = () => {
  const [emailOn, setEmailOn] = useState(true);
  const [inAppOn, setInAppOn] = useState(true);
  const [emailReceiveQuote, setEmailReceiveQuote] = useState(false);
  const [emailSystemUpdate, setEmailSystemUpdate] = useState(false);
  const [emailGeneral, setEmailGeneral] = useState(false);
  const [inappReceiveQuote, setInappReceiveQuote] = useState(false);
  const [inappSystemUpdate, setInappSystemUpdate] = useState(false);
  const [inappGeneral, setInappGeneral] = useState(false);

  return (
    <div className="card space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="medium3">Notification Settings</h2>
          <p className="text-sm text-gray2">
            Get notified when any action takes place
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primaryLight"
            title="Restore To Default"
            className="!w-fit"
          />
          <Button title="Save Update" className="!w-fit" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-12">
          <div className="md:w-1/3">
            <p>Email notification</p>
            <p className="text-xs text-gray2">
              Medical Marketplace will send you email notifications for every
              system action
            </p>
          </div>
          <div className="space-y-4 md:w-2/3">
            <div className="flex items-center gap-2">
              <Switch
                checked={emailOn}
                onCheckedChange={() => setEmailOn(!emailOn)}
                title="On"
                id="on"
              />
              <label htmlFor="on">On</label>
            </div>
            <div>
              <CustomCheckbox
                checked={emailReceiveQuote}
                onChange={() => setEmailReceiveQuote(!emailReceiveQuote)}
                label="Receive quote"
              />
              <p className="text-gray2 text-xs ml-4">
                Check on and off to include fixed price in the price mode option
              </p>
            </div>
            <div>
              <CustomCheckbox
                checked={emailSystemUpdate}
                onChange={() => setEmailSystemUpdate(!emailSystemUpdate)}
                label="Update system settings"
              />
              <p className="text-gray2 text-xs ml-4">
                Check on and off to receive notification on general activities{" "}
              </p>
            </div>
            <div>
              <CustomCheckbox
                checked={emailGeneral}
                onChange={() => setEmailGeneral(!emailGeneral)}
                label="General activities"
              />
              <p className="text-gray2 text-xs ml-4">
                Check on and off to receive notification on general activities{" "}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-12">
          <div className="md:w-1/3">
            <p>In-app notification</p>
            <p className="text-xs text-gray2">
              In-app notifications appear inside your MedProcure dashboard when events occur
            </p>
          </div>
          <div className="space-y-4 md:w-2/3">
            <div className="flex items-center gap-2">
              <Switch
                checked={inAppOn}
                onCheckedChange={() => setInAppOn(!inAppOn)}
                title="On"
                id="inappOn"
              />
              <label htmlFor="inappOn">On</label>
            </div>
            <div>
              <CustomCheckbox
                checked={inappReceiveQuote}
                onChange={() => setInappReceiveQuote(!inappReceiveQuote)}
                label="Receive quote"
              />
              <p className="text-gray2 text-xs ml-4">
                Notify when you receive a new quote-related update
              </p>
            </div>
            <div>
              <CustomCheckbox
                checked={inappSystemUpdate}
                onChange={() => setInappSystemUpdate(!inappSystemUpdate)}
                label="Update system settings"
              />
              <p className="text-gray2 text-xs ml-4">
                Check on and off to receive notification on general activities{" "}
              </p>
            </div>
            <div>
              <CustomCheckbox
                checked={inappGeneral}
                onChange={() => setInappGeneral(!inappGeneral)}
                label="General activities"
              />
              <p className="text-gray2 text-xs ml-4">
                Check on and off to receive notification on general activities{" "}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

