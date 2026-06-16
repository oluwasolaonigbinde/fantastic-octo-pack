"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { Button, EmptyState, SingleSelect } from "@/components/base";
import type { Product } from "@/types/product";
import {
  getProductAvailabilityLabel,
  isProductAvailable,
  getProductListingLocation,
} from "@/utils/productDisplay";

interface ProductGridProps {
  sortBy: string;
  currentPage: number;
  totalPages: number | null;
  products: Product[] | null;
  totalResults: number | null;
  hasFetchError?: boolean;
  fetchErrorMessage?: string | null;
  onPageChange: (page: number) => void;
  onSortChange: (value: string) => void;
  onClearFilters?: () => void;
}

export default function ProductGrid({
  products,
  totalResults,
  hasFetchError,
  fetchErrorMessage,
  currentPage,
  totalPages,
  onPageChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: ProductGridProps) {
  const resultCount = totalResults ?? 0;
  const hasProducts = (products?.length ?? 0) > 0;
  const showFetchError = Boolean(hasFetchError) && !hasProducts;

  return (
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-xl text-gray1">
          <span className="font-semibold">{resultCount}</span> Results Found
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-gray-600">
            Sort by:
          </span>
          <SingleSelect
            value={sortBy}
            className="w-[180px]"
            onValueChange={onSortChange}
            label=""
            options={[
              {
                value: "price-asc",
                label: "Price: Low to High",
              },
              {
                value: "price-desc",
                label: "Price: High to Low",
              },
              {
                value: "name-asc",
                label: "Name: A to Z",
              },
              {
                value: "name-desc",
                label: "Name: Z to A",
              },
              {
                value: "newest",
                label: "Newest First",
              },
              {
                value: "oldest",
                label: "Oldest First",
              },
            ]}
          />
        </div>
      </div>

      {hasProducts ? (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products?.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              title={product.name}
              price={new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(product.pricePerUnit)}
              imageSrc={product.images.find((img) => img.isDefault === true)}
              stockLabel={getProductAvailabilityLabel(product)}
              isAvailable={isProductAvailable(product)}
              location={getProductListingLocation(product)}
              condition={product.condition}
            />
          ))}
        </div>
      ) : showFetchError ? (
        <div className="mb-8 rounded-2xl border border-[#F3D2B3] bg-[#FFF9F4] px-6 py-10">
          <EmptyState
            title="Products are unavailable right now"
            description={
              fetchErrorMessage?.trim() ||
              "The catalogue could not be loaded from the products API."
            }
          />
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10">
          <EmptyState
            title="No products match these filters"
            description="Try adjusting the filters or clear them to browse the full catalogue."
          />
          {onClearFilters ? (
            <div className="mt-4 flex justify-center">
              <Button
                title="Clear Filters"
                variant="secondaryLight"
                size="sm"
                onClick={onClearFilters}
                className="w-auto!"
              />
            </div>
          ) : null}
        </div>
      )}

      {hasProducts && (totalPages ?? 0) > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            title=""
            variant={currentPage === 1 ? "secondaryLight" : "primaryLight"}
            size="sm"
            iconLeft={<ChevronLeft size={20} />}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2! w-auto! min-w-[40px]! ${
              currentPage === 1
                ? "bg-gray-100! text-gray-400! border-gray-200!"
                : "bg-white! text-[#0669D9]! border-[#0669D9]! hover:bg-[#E3F7FF]!"
            }`}
          />

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            title=""
            variant={
              currentPage === totalPages ? "secondaryLight" : "primaryLight"
            }
            size="sm"
            iconRight={<ChevronRight size={20} />}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2! w-auto! min-w-[40px]! ${
              currentPage === totalPages
                ? "bg-gray-100! text-gray-400! border-gray-200!"
                : "bg-white! text-[#0669D9]! border-[#0669D9]! hover:bg-[#E3F7FF]!"
            }`}
          />
        </div>
      ) : null}
    </div>
  );
}
