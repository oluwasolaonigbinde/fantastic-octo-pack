"use client";

import Header from "../../component/header";
import { SingleSelect } from "@/components/base";

const SECTIONS = [
  {
    title: "Today",
    items: Array.from({ length: 2 }, () => ({
      title: "Notification",
      body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendrerit.",
      time: "17/07/2024 3:55pm",
    })),
  },
  {
    title: "Yesterday",
    items: Array.from({ length: 2 }, () => ({
      title: "Notification",
      body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendrerit.",
      time: "17/07/2024 3:55pm",
    })),
  },
  {
    title: "18th November. 2025",
    items: Array.from({ length: 2 }, () => ({
      title: "Notification",
      body: "Lorem ipsum dolor sit amet consectetur. Neque congue pellentesque magna eros hendrerit.",
      time: "17/07/2024 3:55pm",
    })),
  },
];

export default function OemNotificationsPage() {
  return (
    <div>
      <Header title="Profile" description="View and update your profile information" />

      <div className="bg-[#F5F7FB] p-4 md:p-6">
        <section className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-[32px] font-semibold text-gray1">All Notifications</h2>
            <div className="w-full max-w-[160px]">
              <SingleSelect
                label="Sort by:"
                value="all"
                options={[{ value: "all", label: "All" }]}
              />
            </div>
          </div>

          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="mb-5 flex items-center gap-4">
                  <input type="checkbox" defaultChecked className="size-4 rounded border-gray5" />
                  <h3 className="text-[28px] font-semibold text-gray2">{section.title}</h3>
                </div>

                <div className="space-y-5">
                  {section.items.map((item, index) => (
                    <div
                      key={`${section.title}-${index}`}
                      className="flex items-start gap-4 border-b border-[#F4F6FA] pb-5 last:border-b-0"
                    >
                      <input type="checkbox" defaultChecked className="mt-1 size-4 rounded border-gray5" />
                      <div className="flex-1">
                        <p className="text-lg font-medium text-gray1">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-gray3">{item.body}</p>
                      </div>
                      <p className="text-xs text-gray3">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
