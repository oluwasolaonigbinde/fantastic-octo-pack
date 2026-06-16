"use client";

import PieChart from "../piechart";

export function ProductVerificationRatioCard({
  pendingCount,
  approvedCount,
  pendingPct,
  approvedPct,
}: {
  pendingCount: number;
  approvedCount: number;
  pendingPct: number;
  approvedPct: number;
}) {
  const total = pendingCount + approvedCount;

  return (
    <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-[#DDE0E5] bg-white p-5 text-sm lg:text-base">
      <h2 className="text-xl font-medium leading-8 text-[#111827]">
        Product Verification Ratio
      </h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-[#6B7280]">
          You have no submitted products yet.
        </p>
      ) : (
        <>
          <div className="mt-4 min-h-[280px]">
            <PieChart
              data={[
                {
                  name: "Pending verification",
                  value: pendingCount,
                  color: "#FFC000",
                },
                {
                  name: "Approved verification",
                  value: approvedCount,
                  color: "#0669D9",
                },
              ].filter((d) => d.value > 0)}
            />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="size-6 shrink-0 rounded bg-[#FFC000]"
                aria-hidden
              />
              <p className="text-base leading-6 text-black">
                {pendingPct}% - Pending verification ({pendingCount})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="size-6 shrink-0 rounded bg-[#0669D9]"
                aria-hidden
              />
              <p className="text-base leading-6 text-black">
                {approvedPct}% - Approved verification ({approvedCount})
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
