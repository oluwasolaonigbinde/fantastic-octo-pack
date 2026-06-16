"use client";

import { AdminSectionPage } from "@/components/admin/AdminSectionPage";
import { Input } from "@/components/base";

const THREADS = [
  { id: "t1", with: "Northwind Clinics", preview: "Regarding RFQ-1001…", time: "10:25am" },
  { id: "t2", with: "OEM Partners Ltd", preview: "Quote follow-up…", time: "Yesterday" },
] as const;

export default function AdminMessagingPage() {
  return (
    <AdminSectionPage title="Messaging" description="Messages">
      <p className="mb-4 rounded-lg border border-gray5 bg-white px-4 py-3 text-sm text-gray3">
        Admin messaging is not available in Phase 1.
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <aside className="card space-y-2">
          <Input label="Search" placeholder="Search" disabled readOnly />
          <ul className="divide-y divide-gray5">
            {THREADS.map((t) => (
              <li key={t.id} className="py-3 cursor-default">
                <p className="font-medium text-gray1">{t.with}</p>
                <p className="truncate text-xs text-gray3">{t.preview}</p>
                <p className="text-xs text-gray3">{t.time}</p>
              </li>
            ))}
          </ul>
        </aside>
        <section className="card min-h-[320px] flex flex-col border border-gray5 bg-white">
          <div className="flex-1 border-b border-gray5 p-4 text-sm text-gray3">
            Admin, Super Admin, OEM, and Agent accounts cannot start or send Phase 1 messages.
          </div>
          <div className="p-3">
            <Input
              label="Message"
              placeholder="Messaging unavailable"
              disabled
              readOnly
            />
          </div>
        </section>
      </div>
    </AdminSectionPage>
  );
}
