"use client";

export function TopRequestedProductsColumn() {
  return (
    <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-xl font-medium leading-8 text-[#111827]">
        Top 10 Most Requested Product
      </h2>
      <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#DDE0E5] bg-[#F9FAFB] px-4 py-10 text-center text-sm text-[#6B7280] md:h-[350px] md:min-h-0">
        Ranking data is not available yet
      </div>
    </div>
  );
}
