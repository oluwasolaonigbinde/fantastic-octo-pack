"use client";

import Link from "next/link";
import { ArrowRight, CheckSquare, MapPin } from "lucide-react";

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
    <section className="space-y-8 pb-2 md:space-y-14">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[28px] font-extrabold leading-10 text-black md:text-[48px] md:leading-[58px]">
          <span className="hidden md:inline">Similar Products</span>
          <span className="md:hidden">Listed Product</span>
        </h2>

        <Link
          href="/products"
          className="hidden items-center gap-2 text-base font-normal leading-6 text-[#111827] transition hover:text-[#FE6E00] md:inline-flex"
        >
          See All Products
          <ArrowRight size={24} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-[212px] animate-pulse rounded-xl border border-[#DDE0E5] bg-[#F2F4F7] md:h-[471px]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {products.map((product) => {
            const sellerName =
              typeof product.createdBy === "object"
                ? `${product.createdBy.firstName ?? ""} ${
                    product.createdBy.lastName ?? ""
                  }`.trim() || "Marketplace seller"
                : "Marketplace seller";

            return (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                prefetch={false}
                className="group flex h-full min-h-[260px] flex-col overflow-hidden rounded-[24px] border border-[#DDE0E5] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] md:h-[471px]"
              >
                <div className="flex h-full flex-col">
                  <div className="relative h-[108px] overflow-hidden bg-gradient-to-b from-[#FDFDFE] from-[39%] to-[#E0E3E8] md:h-[239px]">
                    <SafeProductImage
                      src={getProductDefaultImageUrl(product)}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[8px] bg-[#FDF5EB] px-2 py-1 text-[10px] font-semibold text-[#AD7F59] md:left-[23px] md:top-[22px] md:text-[18px] md:leading-8">
                      <span className="size-1.5 rounded-full bg-[#FE6E00] md:size-2.5" />
                      {formatConditionLabel(product.condition)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-2 pb-0 pt-2 md:px-4 md:pt-4">
                    <div className="space-y-1">
                      <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-medium leading-[18px] text-[#111827] md:min-h-[64px] md:text-[20px] md:leading-8">
                        {product.name}
                      </h3>
                      <p className="hidden text-xs text-[#667085]">{sellerName}</p>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-2 text-[10px] md:mt-4 md:text-base">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isProductAvailable(product)
                            ? "text-[#16A34A]"
                            : "text-[#98A2B3]"
                        }`}
                      >
                        <CheckSquare className="size-2 md:size-4" />
                        {typeof product.quantityAvailable === "number"
                          ? `${product.quantityAvailable} In stock`
                          : product.availability_status === "in_stock"
                            ? "In stock"
                            : "Stock on request"}
                      </span>
                      <span className="rounded-[8px] bg-[rgba(254,110,0,0.04)] px-1 py-1 text-[10px] font-bold leading-5 text-[#E89F5E] md:px-2 md:text-[24px] md:leading-10">
                        {formatCurrency(product.pricePerUnit)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#4B5563] md:text-base">
                      <MapPin className="size-2 text-[#16A34A] md:size-4" />
                      <span>{getPrimaryProductLocation(product) || "Lagos Nigeria"}</span>
                    </div>

                    <div className="mt-auto -mx-2 flex h-12 items-center justify-between gap-2 bg-[#F6F7F9] px-2 text-[10px] text-[#4B5563] md:-mx-4 md:h-16 md:px-4 md:text-[14px]">
                      <span>
                        Condition:{" "}
                        <span className="font-medium text-[#344054]">
                          {formatConditionLabel(product.condition)}
                        </span>
                      </span>
                      <span>{product.delivery_time || "2 weeks lead time"}</span>
                    </div>
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
