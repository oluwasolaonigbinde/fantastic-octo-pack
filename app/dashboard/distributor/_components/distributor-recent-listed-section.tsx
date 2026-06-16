"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base";
import type { Product } from "@/types/product";
import { DistributorRecentProductsTable } from "./distributor-recent-products-table";

export function DistributorRecentListedSection({
  myProducts,
  isLoading,
  roleSegment,
}: {
  myProducts: Product[] | null | undefined;
  isLoading: boolean;
  roleSegment: string;
}) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[20px] font-medium leading-8 text-[#111827]">
            Recently Listed Product
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-[#4B5563]">
            Top 10 recently listed equipment and consumables
          </p>
        </div>
        {!isLoading && (
          <Button
            title="View All Product"
            iconRight={<ArrowRight className="size-6" />}
            onClick={() => router.push("/dashboard/distributor/catalogue")}
            className="h-14 min-w-[250px] !w-fit rounded-xl px-6 text-base font-normal"
            variant="primary"
            size="md"
          />
        )}
      </div>
      <DistributorRecentProductsTable
        products={myProducts}
        isLoading={isLoading}
        roleSegment={roleSegment}
      />
    </section>
  );
}
