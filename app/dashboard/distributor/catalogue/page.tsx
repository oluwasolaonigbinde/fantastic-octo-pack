"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "../../component/header";
import { Button, Input, SingleSelect, Skeleton } from "@/components/base";
import SafeProductImage from "@/components/product/SafeProductImage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import productService from "@/services/productService";
import { useCategoriesQuery } from "@/hooks/queries/categories";
import { useProductsQuery } from "@/hooks/queries/products";
import { canEditProduct, getListingStatusMeta } from "@/utils/productStatus";
import {
  getProductDefaultImageUrl,
  getProductStockTableValue,
} from "@/utils/productDisplay";
import type { ProductStatus, ProductStatusCounts } from "@/types/product";

const PAGE_SIZE = 10;
const LISTED_STATUSES: ProductStatus[] = ["pending", "approved", "rejected"];
const EMPTY_STATUS_COUNTS: ProductStatusCounts = {
  draft: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

type CatalogueFilters = {
  productName: string;
  status: "" | ProductStatus;
  category: string;
};

const DEFAULT_FILTERS: CatalogueFilters = {
  productName: "",
  status: "",
  category: "",
};

const isListedStatus = (status: ProductStatus): boolean =>
  LISTED_STATUSES.includes(status);

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function DistributorCatalogue() {
  const router = useRouter();
  const { data: authData } = useAppSelector((state) => state.auth);
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesQueryError,
  } = useCategoriesQuery({ page: 1, limit: 50 });

  const [draftFilters, setDraftFilters] = useState<CatalogueFilters>(
    DEFAULT_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<CatalogueFilters>(
    DEFAULT_FILTERS,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [listingSummary, setListingSummary] =
    useState<ProductStatusCounts>(EMPTY_STATUS_COUNTS);
  const [summaryError, setSummaryError] = useState("");

  const token = authData?.tokens?.accessToken;

  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useProductsQuery(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      search: appliedFilters.productName.trim() || undefined,
      category: appliedFilters.category || undefined,
      status: appliedFilters.status || undefined,
      statuses: appliedFilters.status ? undefined : LISTED_STATUSES,
    },
    { enabled: Boolean(token) },
  );
  const products = productsData?.products ?? null;
  const totalPages = productsData?.meta.totalPages ?? 0;
  const message = error instanceof Error ? error.message : "";

  useEffect(() => {
    let ignore = false;

    if (!token) {
      return () => {
        ignore = true;
      };
    }

    const loadSummary = async () => {
      try {
        setSummaryError("");

        const result = await productService.fetchWithFilter({
          token,
          statuses: LISTED_STATUSES,
          includeSummary: true,
          page: 1,
          limit: 1,
        });

        if (ignore) return;

        setListingSummary(
          result.data.summary?.statusCounts ?? EMPTY_STATUS_COUNTS,
        );
      } catch (error) {
        if (ignore) return;

        setListingSummary(EMPTY_STATUS_COUNTS);
        setSummaryError(
          error instanceof Error
            ? error.message
            : "Unable to load listing summary right now.",
        );
      }
    };

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [token]);

  const visibleProducts = useMemo(
    () => (products ?? []).filter((product) => isListedStatus(product.status)),
    [products],
  );
  const displayedSummary = token ? listingSummary : EMPTY_STATUS_COUNTS;
  const displayedSummaryError = token ? summaryError : "";

  const totalListedProducts =
    displayedSummary.pending + displayedSummary.approved + displayedSummary.rejected;
  const approvedCount = displayedSummary.approved;
  const notApprovedCount = displayedSummary.pending + displayedSummary.rejected;
  const resolvedTotalPages = Math.max(1, totalPages);

  const categoryOptions = categories.map((category) => ({
    value: category.name,
    label: category.name,
  }));

  const categoryLoadError =
    !categoriesLoading && categoriesError
      ? (categoriesQueryError instanceof Error && categoriesQueryError.message) ||
        "Unable to load categories for filtering right now."
      : "";

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
  };

  const hasNoMatches = !isLoading && !isError && visibleProducts.length === 0;

  return (
    <div>
      <Header
        title="Product Listings"
        description="Create, view and edit all listed products"
      />

      <div className="space-y-8 p-4 md:p-6">
        <section className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-4xl font-semibold text-gray1">
              {totalListedProducts}
            </p>
            <p className="mt-2 text-sm text-gray2">Total listed product</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray3">
              <span>Approved verification: {approvedCount}</span>
              <span>Not approved verification: {notApprovedCount}</span>
            </div>
            {displayedSummaryError ? (
              <p className="mt-3 text-sm text-danger">
                {displayedSummaryError || "Unable to load listing summary right now."}
              </p>
            ) : null}
          </div>

          <Button
            title="Add New Product"
            size="md"
            iconLeft={<Plus className="size-4" />}
            className="w-full lg:w-auto"
            onClick={() => router.push("/dashboard/distributor/catalogue/new")}
          />
        </section>

        <section className="card space-y-5">
          <div>
            <h3 className="medium3 text-gray1">All Listed Product</h3>
            <p className="text-sm text-gray3">
              Total list of all listed equipment and consumables
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">Filter table list by:</p>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]">
              <Input
                label="Product name"
                placeholder="Enter product name"
                value={draftFilters.productName}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    productName: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyFilters();
                  }
                }}
              />

              <SingleSelect
                label="Verification status"
                placeholder="Select option"
                value={draftFilters.status}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: value as CatalogueFilters["status"],
                  }))
                }
              />

              <SingleSelect
                label="Category"
                placeholder={
                  categoriesLoading ? "Loading categories..." : "Select category"
                }
                value={draftFilters.category}
                options={categoryOptions}
                disabled={Boolean(categoryLoadError)}
                error={categoryLoadError}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({ ...prev, category: value }))
                }
              />

              <div className="flex items-end">
                <Button
                  title="Filter"
                  size="md"
                  iconLeft={<SlidersHorizontal className="size-4" />}
                  onClick={applyFilters}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray5">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity in stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleProducts.map((product) => {
                    const statusMeta = getListingStatusMeta(product.status);
                    return (
                      <TableRow key={product._id}>
                        <TableCell className="min-w-[240px]">
                          <div className="flex items-center gap-3">
                            <SafeProductImage
                              src={getProductDefaultImageUrl(product)}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="size-10 rounded-lg object-cover"
                            />
                            <span className="font-medium text-gray1">
                              {product.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.pricePerUnit)}</TableCell>
                        <TableCell>{getProductStockTableValue(product)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-primary">
                            <button
                              type="button"
                              aria-label={`View ${product.name}`}
                              onClick={() =>
                                router.push(
                                  `/dashboard/distributor/catalogue/${product._id}`,
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Edit ${product.name}`}
                              disabled
                              title={
                                canEditProduct(product.status)
                                  ? "Edit flow is being re-aligned to the approved lifecycle."
                                  : "Editing is locked once a product is submitted for review."
                              }
                              className="cursor-not-allowed text-primary/40"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {hasNoMatches ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-gray3">
                        No products matched your current filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </div>

          {isError && !isLoading ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {message || "Unable to load your product listings right now."}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-gray3">
              <span>Page</span>
              <span className="inline-flex min-w-[36px] justify-center rounded-lg border border-gray5 px-3 py-1 text-gray1">
                {currentPage}
              </span>
              <span>of {resolvedTotalPages}</span>
            </div>

            <div className="flex gap-2">
              <Button
                title="Previous"
                variant="secondaryLight"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="w-auto"
              />
              <Button
                title="Next"
                size="sm"
                disabled={currentPage >= resolvedTotalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(resolvedTotalPages, page + 1))
                }
                className="w-auto"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
