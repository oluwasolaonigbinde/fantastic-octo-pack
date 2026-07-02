"use client";

import { Factory } from "lucide-react";

export default function OemsManagement() {
  return (
    <div className="p-5 lg:p-6">
      <section className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray5 bg-white p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#E7F1FF] text-primary">
          <Factory size={24} />
        </span>
        <h3 className="mt-4 text-xl font-semibold text-gray1">OEMs Management</h3>
        <p className="mt-2 max-w-md text-sm text-gray3">
          Manage manufacturer accounts and their product associations here.
          This section is coming soon.
        </p>
      </section>
    </div>
  );
}
