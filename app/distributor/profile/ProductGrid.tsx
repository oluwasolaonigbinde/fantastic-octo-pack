"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/base";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";

interface ProductGridProps {
  sortBy: string;
  currentPage: number;
  totalPages: number | null;
  products: Product[] | null;
  totalResults: number | null;
  onPageChange: (page: number) => void;
  onSortChange: (value: string) => void;
}


export default function ProductGrid({
  products,
  totalResults,
  currentPage,
  totalPages,
  onPageChange,
}: ProductGridProps) {


  return (
    <div className="w-full bg-white rounded-3xl p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        All Listed Products
      </h2>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4">
        {products?.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalResults && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  title=""
                  variant={currentPage === 1 ? "secondaryLight" : "primaryLight"}
                  size="sm"
                  iconLeft={<ChevronLeft size={20} />}
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2! w-auto! min-w-10! ${
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
                  className={`p-2! w-auto! min-w-10! ${
                    currentPage === totalPages
                      ? "bg-gray-100! text-gray-400! border-gray-200!"
                      : "bg-white! text-[#0669D9]! border-[#0669D9]! hover:bg-[#E3F7FF]!"
                  }`}
                />
              </div>
            )}
    </div>
  );
}

