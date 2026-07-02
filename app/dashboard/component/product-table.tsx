"use client";

import { Button } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Skeleton } from "@/components/base";
import { useCategoriesQuery } from "@/hooks/queries/categories";
import {
  useMyProductsQuery,
  useProductsQuery,
} from "@/hooks/queries/products";
import { useState } from "react";
import { SingleSelect } from "@/components/base";
import { Input } from "@/components/base";
import { EmptyState } from "@/components/base";
import SafeProductImage from "@/components/product/SafeProductImage";
import { getListingStatusMeta } from "@/utils/productStatus";
import {
  getProductDefaultImageUrl,
  getProductStockTableValue,
} from "@/utils/productDisplay";
import type { ProductStatus } from "@/types/product";

interface ProductTableProps {
  className?: string;
  hasfilter?: boolean;
  hasPagination?: boolean;
  isSingleUserTable?: boolean;
}

const ProductTable = ({
  hasfilter,
  hasPagination,
  isSingleUserTable,
  className,
}: ProductTableProps) => {
  const router = useRouter();
  const { data: categories = [] } = useCategoriesQuery();
  const [productName, setProductName] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<{
    search?: string;
    status?: ProductStatus;
    category?: string;
  }>({});
  const { data: authData } = useAppSelector((state) => state.auth);

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
  } = useProductsQuery(
    {
      search: appliedFilters.search,
      status: appliedFilters.status,
      category: appliedFilters.category,
      page: currentPage,
    },
    { enabled: !isSingleUserTable },
  );

  const {
    data: myProductsData,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useMyProductsQuery(authData?._id, { enabled: Boolean(isSingleUserTable) });

  const products = productsData?.products ?? null;
  const myProducts = myProductsData?.products ?? null;
  const page = productsData?.meta.page ?? 1;
  const totalPages = productsData?.meta.totalPages ?? 0;
  const hasNextPage = productsData?.meta.hasNextPage ?? false;
  const hasPreviousPage = productsData?.meta.hasPreviousPage ?? false;
  const nextPage = productsData?.meta.nextPage ?? null;
  const previousPage = productsData?.meta.previousPage ?? null;

  const isLoading = isSingleUserTable ? isMyLoading : isProductsLoading;
  const isError = isSingleUserTable ? isMyError : isProductsError;
  const message = productsError instanceof Error ? productsError.message : "";
  const hasLoadError = isSingleUserTable
    ? isError && !isLoading && myProducts === null
    : isError && !isLoading && products === null;

  const fetchFilteredProducts = () => {
    setAppliedFilters({
      search: productName || undefined,
      status: statusFilter || undefined,
      category: category || undefined,
    });
    setCurrentPage(1);
  };

  const fetchPrevious = () => {
    if (previousPage) setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const fetchNext = () => {
    if (nextPage) setCurrentPage((prev) => prev + 1);
  };

  return (
    <>
      {hasfilter && (
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-6 flex-wra/p w-full">
            {/* Product name */}
            <Input
              label="Product name"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />

            {/* Status */}
            <SingleSelect
              value={statusFilter}
              label="Status"
              onValueChange={(val) => setStatusFilter(val as "" | ProductStatus)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-6 w-full">
            <SingleSelect
              value={category}
              label="Categories"
              onValueChange={(val) => setCategory(val)}
              options={categories.map((item) => ({
                value: item.name,
                label: item.name,
              }))}
              className="w-full"
            />

            <Button
              title="Filter"
              variant="primary"
              size="md"
              iconLeft={<SlidersHorizontal className="size-4" />}
              className="whitespace-nowrap self-end"
              onClick={fetchFilteredProducts}
            />
          </div>
        </div>
      )}

      <div className={`max-h-[400px] overflow-y-auto ${className}`}>
        {!isLoading ? (
          <>
            <Table>
              <TableHeader className="text-gray3">
                <TableRow className="text-gray3">
                  {[
                    "Product name",
                    "Price",
                    "Quantity in stock",
                    "Status",
                    "Category",
                    "Action",
                  ].map((item) => (
                    <TableHead key={item.split(" ")[0]}>{item}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSingleUserTable
                  ? myProducts?.map((product, idx) => {
                       const chip = getListingStatusMeta(product.status);
                      return (
                        <TableRow key={`recent` + idx}>
                          <TableCell className="flex items-center gap-2">
                            <SafeProductImage
                              src={getProductDefaultImageUrl(product)}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="size-[32px] rounded"
                            />
                            {product.name}
                          </TableCell>
                          <TableCell>NGN {product.pricePerUnit}</TableCell>
                          <TableCell>{getProductStockTableValue(product)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chip.className}`}>
                              {chip.label}
                            </span>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="inline-flex items-center gap-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/${authData?.role}/catalogue/${product._id}`
                                )
                              }
                              className="w-full text-success cursor-pointer"
                            >
                              <Eye />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : products?.map((product, idx) => {
                       const chip = getListingStatusMeta(product.status);
                      return (
                        <TableRow key={`recent` + idx}>
                          <TableCell className="flex items-center gap-2">
                            <SafeProductImage
                              src={getProductDefaultImageUrl(product)}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="size-[32px] rounded"
                            />
                            {product.name}
                          </TableCell>
                          <TableCell>NGN {product.pricePerUnit}</TableCell>
                          <TableCell>{getProductStockTableValue(product)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chip.className}`}>
                              {chip.label}
                            </span>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="inline-flex items-center gap-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/${authData?.role}/catalogue/${product._id}`
                                )
                              }
                              className="w-full text-success cursor-pointer"
                            >
                              <Eye />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
            {isSingleUserTable
              ? myProducts?.length === 0 && (
                  <EmptyState
                    icon={<ClipboardList />}
                    title="You have no products yet"
                    description="Add a draft product to see it appear in your catalogue."
                  />
                )
              : products?.length === 0 && (
                  <EmptyState
                    icon={<ClipboardList />}
                    title="You have no products yet"
                    description="Add a draft product to see it appear in your catalogue."
                  />
                )}

            {hasPagination && (
              <div className="flex items-center justify-between max-w-[320px] mt-6">
                <div className="flex items-center gap-3">
                  <span>Page</span>
                  <Input
                    label=""
                    disabled
                    value={page}
                    className="max-w-[45px]"
                  />
                  <span className="whitespace-nowrap">of {totalPages}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    title=""
                    iconLeft={<ArrowLeft />}
                    disabled={!hasPreviousPage}
                    onClick={fetchPrevious}
                    className="!px-4 !text-gray1 disabled:!border-gray5 disabled:!bg-gray5"
                  />
                  <Button
                    title=""
                    iconRight={<ArrowRight />}
                    disabled={!hasNextPage}
                    onClick={fetchNext}
                    className="!px-4 !text-gray1 disabled:!border-gray5 disabled:!bg-gray5"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Skeleton className="h-16 mb-2" />
            <Skeleton className="h-16 mb-2" />
            <Skeleton className="h-16 mb-2" />
            <Skeleton className="h-16 mb-2" />
            <Skeleton className="h-16 mb-2" />
            <Skeleton className="h-16 mb-2" />
          </>
        )}
        {hasLoadError && (
          <div className="h-full flex justify-center gap-6 text-danger/80">
            <div>
              <ClipboardList className="mx-auto" />
              <p>{message || "Error loading products"}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductTable;

