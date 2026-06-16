import React from "react";
import Image from "next/image";
import { SingleSelect } from "@/components/base";

const Preferences = () => {
  return (
    <div className="card space-y-8">
      <div>
        <h2 className="medium3">Preference</h2>
        <p className="text-sm text-gray2">
          Make changes to your system settings
        </p>
      </div>

      <div>
        <h2 className="medium4">Theme</h2>
        <p className="text-gray2">
          Change the appearance of your application by selecting your most
          preferred theme - Light, dark, or system default for a more
          personalized look and feel.
        </p>
      </div>

      <div className="flex gap-2 text-gray1">
        <div className="">
          <Image src="/images/light.png" alt="light" width={263} height={176} />
          <div className="flex gap-3">
            <input type="radio" name="theme" value="light" id="light" />
            <label htmlFor="light" className="medium6">
              Light mode
            </label>
          </div>
        </div>
        <div className="">
          <Image src="/images/dark.png" alt="light" width={263} height={176} />
          <div className="flex gap-3">
            <input type="radio" name="theme" value="dark" id="dark" />
            <label htmlFor="dark" className="medium6">
              Dark mode
            </label>
          </div>
        </div>
        <div className="">
          <Image src="/images/system.png" alt="light" width={263} height={176} />
          <div className="flex gap-3">
            <input type="radio" name="theme" value="system" id="system" />
            <label htmlFor="system" className="medium6">
              System default mode
            </label>
          </div>
        </div>
      </div>

      <form className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <label htmlFor="tz-pref" className="w-full sm:w-auto min-w-[140px]">
            Time zone
          </label>
          <SingleSelect
            value="utc+1"
            label=""
            placeholder="Select time zone"
            options={[
              { label: "UTC +01:00 West Africa Stand....", value: "utc+1" },
              { label: "UTC 00:00 Europe/London", value: "utc+0" },
              { label: "UTC -06:00 Central America", value: "utc-6" },
            ]}
            className="max-w-[320px]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap w-full">
          <label htmlFor="lang-pref" className="w-full sm:w-auto min-w-[140px]">
            Language
          </label>
          <SingleSelect
            value="en-us"
            label=""
            placeholder="Select language"
            onValueChange={(val) => console.log("Language change::", val)}
            options={[
              { label: "English (US)", value: "en-us" },
              { label: "English (GB)", value: "en-gb" },
              { label: "Spanish", value: "esp" },
              { label: "French", value: "fr" },
            ]}
            className="max-w-[320px]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap w-full">
          <label htmlFor="landing-pref" className="w-full sm:w-auto min-w-[140px]">
            Default landing page
          </label>
          <SingleSelect
            value="dashboard"
            label=""
            placeholder="Select page"
            options={[
              { label: "Dashboard", value: "dashboard" },
              { label: "Quotes", value: "quotes" },
            ]}
            className="max-w-[320px]"
          />
        </div>
      </form>
    </div>
  );
};

export default Preferences;

