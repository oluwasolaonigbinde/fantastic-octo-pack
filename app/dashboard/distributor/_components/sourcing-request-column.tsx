"use client";

const VARIANT_STYLES: Record<
  "error" | "info" | "warning" | "success",
  { box: string; text: string }
> = {
  error: {
    box: "border border-[#E33C13] bg-[#FFE3DD]",
    text: "text-[#E33C13]",
  },
  info: {
    box: "border border-[#017BED] bg-[#E2F1FF]",
    text: "text-[#017BED]",
  },
  warning: {
    box: "border border-[#FFC000] bg-[#FFF6D9]",
    text: "text-[#FFC000]",
  },
  success: {
    box: "border border-[#13A83B] bg-[#DEFFE7]",
    text: "text-[#13A83B]",
  },
};

export type SourcingContactVariant = keyof typeof VARIANT_STYLES;

export type SourcingContactCard = {
  initials: string;
  name: string;
  phone: string;
  email: string;
  variant: SourcingContactVariant;
};

export function SourcingRequestColumn({ items }: { items: SourcingContactCard[] }) {
  return (
    <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-xl font-medium leading-8 text-[#111827]">
        Sourcing Request
      </h2>
      {items.length === 0 ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#DDE0E5] bg-[#F9FAFB] px-4 py-10 text-center text-sm text-[#6B7280]">
          No sourcing requests yet
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 overflow-y-auto">
          {items.map((row, idx) => {
            const v = VARIANT_STYLES[row.variant];
            return (
              <div
                key={`${row.email}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-[#DDE0E5] p-4"
              >
                <div
                  className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl p-2.5 ${v.box}`}
                >
                  <span className={`text-base font-medium leading-7 ${v.text}`}>
                    {row.initials}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 text-black">{row.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs leading-[18px] text-[#6B7280] md:inline md:whitespace-nowrap">
                    <span>{row.phone}</span>
                    <span className="hidden text-[#6B7280] md:inline">|</span>
                    <span className="break-all">{row.email}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
