import Image from "next/image";

import { SingleSelect } from "@/components/base";

const themeCards = [
  { id: "light", image: "/images/light.png", label: "Light mode" },
  { id: "dark", image: "/images/dark.png", label: "Dark mode" },
  { id: "system", image: "/images/system.png", label: "System default mode" },
];

export default function Preferences() {
  return (
    <div className="rounded-2xl border border-[#DDE0E5] bg-white px-6 py-8 shadow-sm">
      <div>
        <h2 className="text-[20px] font-medium leading-[1.6] text-gray1">Preference</h2>
        <p className="text-base text-gray2">Make changes to your system settings</p>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray1">Theme</h3>
        <p className="mt-2 max-w-[644px] text-base leading-6 text-gray2">
          Change the appearance of your application by selecting your most preferred theme -
          Light, dark, or system default for a more personalized look and feel.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {themeCards.map((card, index) => (
            <label key={card.id} className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-[#F9FAFB]">
                <Image
                  src={card.image}
                  alt={card.label}
                  width={263}
                  height={176}
                  className="h-[176px] w-full object-cover"
                />
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray1">
                <input type="radio" name="oem-theme" defaultChecked={index === 0} />
                {card.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-center">
          <label className="text-lg font-medium text-gray1">Time zone setting</label>
          <SingleSelect
            label=""
            value="utc+1"
            options={[
              { value: "utc+1", label: "UTC +01:00 West Africa Stand..." },
              { value: "utc+0", label: "UTC 00:00 Europe/London" },
              { value: "utc-6", label: "UTC -06:00 Central America" },
            ]}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-center">
          <label className="text-lg font-medium text-gray1">Language Selection</label>
          <SingleSelect
            label=""
            value="en-us"
            options={[
              { value: "en-us", label: "English (US)" },
              { value: "en-gb", label: "English (GB)" },
              { value: "fr", label: "French" },
            ]}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-center">
          <label className="text-lg font-medium text-gray1">Default landing page</label>
          <SingleSelect
            label=""
            value="dashboard"
            options={[
              { value: "dashboard", label: "Dashboard" },
              { value: "requests", label: "Listing Request" },
              { value: "distributors", label: "Distributors" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
