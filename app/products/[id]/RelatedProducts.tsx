"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckSquare, MapPin } from "lucide-react";

import SafeProductImage from "@/components/product/SafeProductImage";
import type { Product } from "@/types/product";
import {
  getPrimaryProductLocation,
  getProductDefaultImageUrl,
  isProductAvailable,
} from "@/utils/productDisplay";

interface RelatedProductsProps {
  products: Product[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace(/^NGN\s?/, "\u20A6");
}

function formatConditionLabel(condition?: string | null): string {
  if (!condition) {
    return "New";
  }

  return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
}

export default function RelatedProducts({
  products,
  isLoading = false,
}: RelatedProductsProps) {
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 pb-2 md:space-y-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[28px] font-extrabold leading-9 text-black md:text-[34px] md:leading-10">
          <span className="hidden md:inline">Similar Products</span>
          <span className="md:hidden">Listed Product</span>
        </h2>

        <Link
          href="/products"
          className="hidden items-center gap-2 text-sm font-normal leading-6 text-[#111827] transition hover:text-[#FE6E00] md:inline-flex"
        >
          See All Products
          <ArrowRight size={20} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-[252px] animate-pulse rounded-xl border border-[#DDE0E5] bg-[#F2F4F7] md:h-[390px]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {products.map((product) => {
            return (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                prefetch={false}
                className="group flex min-h-[252px] flex-col overflow-hidden rounded-2xl border border-[#DDE0E5] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] md:min-h-[390px]"
              >
                <div className="relative h-[126px] overflow-hidden bg-gradient-to-b from-[#F8F9FB] to-[#E8EBF0] md:h-[205px]">
                  <SafeProductImage
                    src={getProductDefaultImageUrl(product)}
                    alt={product.name}
                    fill
                    className="object-contain p-2 md:p-3"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#FDF5EB] px-2 py-1 text-[10px] font-semibold text-[#AD7F59] md:left-4 md:top-4 md:text-xs">
                    <span className="size-1.5 rounded-full bg-[#FE6E00]" />
                    {formatConditionLabel(product.condition)}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3 md:p-4">
                  <h3 className="line-clamp-2 min-h-[40px] text-[13px] font-medium leading-5 text-[#111827] md:min-h-[48px] md:text-[15px] md:leading-6">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex flex-col gap-1.5 md:mt-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] md:text-xs ${
                        isProductAvailable(product)
                          ? "text-[#16A34A]"
                          : "text-[#98A2B3]"
                      }`}
                    >
                      <CheckSquare className="size-3 md:size-3.5" />
                      {typeof product.quantityAvailable === "number"
                        ? `${product.quantityAvailable} in stock`
                        : product.availability_status === "in_stock"
                          ? "In stock"
                          : "Stock on request"}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#4B5563] md:text-xs">
                      <MapPin className="size-3 text-[#16A34A] md:size-3.5" />
                      <span className="truncate">{getPrimaryProductLocation(product) || "Lagos Nigeria"}</span>
                    </div>
                    <span className="w-fit rounded-md bg-[rgba(254,110,0,0.04)] px-2 py-1 text-sm font-bold leading-5 text-[#FE6E00] md:text-base">
                      {formatCurrency(product.pricePerUnit)}
                    </span>
                  </div>

                  <div className="mt-auto flex min-h-11 items-center justify-between gap-2 px-0 py-2 text-[11px] text-[#4B5563] md:min-h-12 md:text-xs">
                    <span>
                      Condition:{" "}
                      <span className="font-medium text-[#344054]">
                        {formatConditionLabel(product.condition)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-right">
                      <CalendarDays className="size-3 shrink-0 text-[#667085]" />
                      {product.delivery_time || "2 weeks lead time"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
