"use client";

import { Send } from "lucide-react";

import Header from "../../component/header";

const PREVIEW_THREADS = [
  {
    id: "preview-1",
    name: "Messaging unavailable",
    description: "OEM messaging is not active in Phase 1.",
    time: "Read-only",
  },
  {
    id: "preview-2",
    name: "No active thread",
    description: "Buyer, distributor, and engineer messaging is handled elsewhere.",
    time: "Read-only",
  },
] as const;

export default function OemMessaging() {
  return (
    <div>
      <Header title="Messaging" description="20th November, 2025" />

      <div className="bg-[#F5F7FB] p-4 md:p-6">
        <p className="mb-4 rounded-lg border border-gray5 bg-white px-4 py-3 text-sm text-gray3">
          OEM messaging is not available in Phase 1.
        </p>

        <section className="overflow-hidden rounded-lg border border-gray5 bg-white">
          <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="border-b border-gray5 md:border-b-0 md:border-r">
              <div className="border-b border-gray5 px-4 py-4">
                <h2 className="text-base font-semibold text-gray1">Conversations</h2>
                <p className="mt-1 text-sm text-gray3">Read-only preview</p>
              </div>

              {PREVIEW_THREADS.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-start gap-3 border-b border-gray5 px-4 py-4"
                >
                  <span className="size-10 shrink-0 rounded-full bg-gray5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray1">
                      {thread.name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray3">
                      {thread.description}
                    </span>
                  </span>
                  <span className="text-xs text-gray3">{thread.time}</span>
                </div>
              ))}
            </aside>

            <div className="flex min-h-[520px] flex-col">
              <div className="border-b border-gray5 px-4 py-4">
                <p className="text-sm font-semibold text-gray1">Messaging unavailable</p>
                <p className="mt-1 text-xs text-gray3">This route is non-functional.</p>
              </div>

              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray3">
                OEM, Admin, Super Admin, and Agent accounts cannot start or send Phase 1 messages.
              </div>

              <div className="border-t border-gray5 p-4">
                <div className="flex items-center gap-2 rounded-lg border border-gray5 bg-gray7 px-3 py-2">
                  <input
                    type="text"
                    disabled
                    readOnly
                    placeholder="Messaging unavailable"
                    aria-label="Message text disabled"
                    className="h-10 min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm text-gray3 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    aria-label="Send disabled"
                    className="inline-flex size-10 cursor-not-allowed items-center justify-center rounded-lg bg-gray4 text-white"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
