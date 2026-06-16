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
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { Skeleton } from "@/components/base";
import { fetchCategories } from "@/store/slices/category-slice";
import { useEffect, useState } from "react";
import { SingleSelect } from "@/components/base";
import { Input } from "@/components/base";
import { fetchProducts } from "@/store/slices/product-slice";
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
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.category);
  const {
    products,
    myProducts,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
    message,
    nextPage,
    previousPage,
  } = useAppSelector((state) => state.product);
  const { data } = useAppSelector((state) => state.auth);
  const [productName, setProductName] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [category, setCategory] = useState("");
  const hasLoadError = isSingleUserTable
    ? isError && !isLoading && myProducts === null
    : isError && !isLoading && products === null;

  useEffect(() => {
    dispatch(fetchCategories({}));
  }, [dispatch]);

  const fetchFilteredProducts = async () => {
    await dispatch(
        fetchProducts({
          token: data?.tokens?.accessToken,
          search: productName || undefined,
          status: statusFilter || undefined,
          category: category || undefined,
        })
      );
  };

  const fetchPrevious = async () => {
    if (previousPage) {
      await dispatch(
        fetchProducts({
          token: data?.tokens?.accessToken,
          search: productName || undefined,
          status: statusFilter || undefined,
          category: category || undefined,
          page: page - 1,
        })
      );
    }
  };

  const fetchNext = async () => {
    if (nextPage) {
      await dispatch(
        fetchProducts({
          token: data?.tokens?.accessToken,
          search: productName || undefined,
          status: statusFilter || undefined,
          category: category || undefined,
          page: page + 1,
        })
      );
    }
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
                                  `/dashboard/${data?.role}/catalogue/${product._id}`
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
                                  `/dashboard/${data?.role}/catalogue/${product._id}`
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

