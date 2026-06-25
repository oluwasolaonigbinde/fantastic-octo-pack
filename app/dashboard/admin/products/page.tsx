"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../component/header";
import { Button, Input, SingleSelect, Skeleton } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Download, Eye, Filter } from "lucide-react";
import { ADMIN_PRODUCTS_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import productService from "@/services/productService";
import { fetchProducts } from "@/store/slices/product-slice";
import { fetchCategories } from "@/store/slices/category-slice";
import { getListingStatusMeta } from "@/utils/productStatus";
import { getProductStockTableValue } from "@/utils/productDisplay";
import type { Product, ProductStatus, ProductStatusCounts } from "@/types/product";
import type { UserData } from "@/types/user";

type AdminProductFilters = {
  search: string;
  status: "all" | ProductStatus;
  category: string;
  submittedFrom: string;
  submittedTo: string;
};

const DEFAULT_FILTERS: AdminProductFilters = {
  search: "",
  status: "all",
  category: "all",
  submittedFrom: "",
  submittedTo: "",
};

const LISTING_SUMMARY_STATUSES: ProductStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
];

const formatMoney = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso?: string | null): string => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-GB")} - ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const getDistributorName = (createdBy: string | UserData): string => {
  if (typeof createdBy === "string") return createdBy;
  return `${createdBy.firstName ?? ""} ${createdBy.lastName ?? ""}`.trim() || "Distributor";
};

const getAdminTableStatusTextClass = (status: ProductStatus): string => {
  switch (status) {
    case "approved":
      return "text-success";
    case "pending":
      return "text-warning";
    case "rejected":
      return "text-danger";
    default:
      return "text-gray3";
  }
};

function AdminDateChip({ label }: { label: string }) {
  return (
    <div className="inline-flex h-[60px] items-center gap-4 rounded-[18px] border border-gray5 bg-white px-5 text-[15px] font-medium text-gray1">
      <span>{label}</span>
      <CalendarDays size={18} className="text-gray2" />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray5 bg-white px-5 py-6">
      <p className="text-[22px] font-semibold leading-8 text-gray1 lg:text-[28px] lg:leading-9">
        {value}
      </p>
      <p className="mt-3 text-base font-medium leading-6 text-gray2">{title}</p>
      {subtitle ? (
        <p className="mt-3 text-sm leading-5 text-gray3">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  const dispatch = useAppDispatch();
  const { data: authData } = useAppSelector((state) => state.auth);
  const { categories } = useAppSelector((state) => state.category);
  const {
    products,
    isLoading,
    totalProducts,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = useAppSelector((state) => state.product);

  const [draftFilters, setDraftFilters] =
    useState<AdminProductFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AdminProductFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [listingSummary, setListingSummary] =
    useState<ProductStatusCounts | null>(null);

  const token = authData?.tokens?.accessToken;

  const updateDraftFilter = <K extends keyof AdminProductFilters>(
    key: K,
    value: AdminProductFilters[K]
  ) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (token && categories.length === 0) {
      dispatch(fetchCategories({}));
    }
  }, [dispatch, token, categories.length]);

  useEffect(() => {
    if (!token) return;

    dispatch(
      fetchProducts({
        token,
        populate: "createdBy,assignedOem",
        page: currentPage,
        search: appliedFilters.search.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        category: appliedFilters.category !== "all" ? appliedFilters.category : undefined,
        submittedFrom: appliedFilters.submittedFrom || undefined,
        submittedTo: appliedFilters.submittedTo || undefined,
      })
    );
  }, [dispatch, token, appliedFilters, currentPage]);

  useEffect(() => {
    let ignore = false;

    if (!token) {
      return () => {
        ignore = true;
      };
    }

    const loadListingSummary = async () => {
      try {
        const result = await productService.fetchWithFilter({
          token,
          populate: "createdBy,assignedOem",
          page: 1,
          limit: 1,
          includeSummary: true,
          search: appliedFilters.search.trim() || undefined,
          statuses: LISTING_SUMMARY_STATUSES,
          category: appliedFilters.category !== "all" ? appliedFilters.category : undefined,
          submittedFrom: appliedFilters.submittedFrom || undefined,
          submittedTo: appliedFilters.submittedTo || undefined,
        });

        if (ignore) return;

        setListingSummary(result.data.summary?.statusCounts ?? null);
      } catch {
        if (ignore) return;
        setListingSummary(null);
      }
    };

    void loadListingSummary();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, token]);

  const visibleProducts = useMemo(() => products ?? [], [products]);
  const equipmentCount = useMemo(
    () =>
      visibleProducts.filter(
        (product) => product.category.toLowerCase() === "equipment"
      ).length,
    [visibleProducts]
  );
  const consumablesCount = useMemo(
    () =>
      visibleProducts.filter(
        (product) => product.category.toLowerCase() === "consumables"
      ).length,
    [visibleProducts]
  );
  const topMetrics = useMemo(
    () => {
      const hasLoadedProducts = products !== null;
      const liveListingSummary = token ? listingSummary : null;

      return [
        {
          title: "Total product listed",
          value: String(
            hasLoadedProducts
              ? totalProducts
              : ADMIN_PRODUCTS_FIGMA_FALLBACK.totals.totalListed
          ),
          subtitle: `Equipment: ${equipmentCount} | Consumables: ${consumablesCount}`,
        },
        {
          title: "Approved Product",
          value: String(
            liveListingSummary
              ? liveListingSummary.approved
              : ADMIN_PRODUCTS_FIGMA_FALLBACK.totals.approved
          ),
        },
        {
          title: "Pending Product",
          value: String(
            liveListingSummary
              ? liveListingSummary.pending
              : ADMIN_PRODUCTS_FIGMA_FALLBACK.totals.pending
          ),
        },
        {
          title: "Declined Product",
          value: String(
            liveListingSummary
              ? liveListingSummary.rejected
              : ADMIN_PRODUCTS_FIGMA_FALLBACK.totals.declined
          ),
        },
      ];
    },
    [consumablesCount, equipmentCount, listingSummary, products, token, totalProducts]
  );

  return (
    <div>
      <Header
        title="Products & Listings"
        description="View all products and listing requests"
      />

      <div className="space-y-6 p-5 lg:p-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <AdminDateChip
              label={ADMIN_PRODUCTS_FIGMA_FALLBACK.dateRangeLabel}
            />

            <Button
              title="Export Record"
              iconLeft={<Download size={16} />}
              disabled
              className="h-[60px] w-full rounded-[14px] opacity-100 disabled:bg-primary disabled:text-white lg:w-[230px]"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {topMetrics.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray5 bg-white p-5 lg:min-h-[1180px]">
          <h3 className="text-xl font-semibold leading-8 text-gray1">
            All Listed Products
          </h3>

          <p className="mt-6 text-sm font-medium text-gray2">
            Filter table list by:
          </p>

          <div className="mt-3 grid gap-3 lg:grid-cols-[250px_250px_250px_250px]">
            <Input
              label="Product name"
              placeholder="Enter product name"
              value={draftFilters.search}
              onChange={(event) => updateDraftFilter("search", event.target.value)}
            />
            <Input
              label="Date listed"
              type="text"
              placeholder="From - To"
              value={draftFilters.submittedFrom}
              onFocus={(event) => {
                event.currentTarget.type = "date";
              }}
              onBlur={(event) => {
                if (!event.currentTarget.value) event.currentTarget.type = "text";
              }}
              onChange={(event) =>
                updateDraftFilter("submittedFrom", event.target.value)
              }
            />
            <SingleSelect
              label="Category"
              value={draftFilters.category}
              onValueChange={(value) => updateDraftFilter("category", value)}
              options={[
                { value: "all", label: "Select category" },
                ...categories.map((category) => ({
                  value: category.name,
                  label: category.name,
                })),
              ]}
            />
            <Button
              title="Filter"
              iconLeft={<Filter size={16} />}
              className="h-[60px] rounded-[14px] lg:self-end"
              onClick={applyFilters}
            />
          </div>

          <div className="mt-6 overflow-x-auto overflow-y-hidden">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow>
                    {[
                      "Product name",
                      "Date listed",
                      "Distributor name",
                      "Category",
                      "Qty",
                      "Unit price",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <TableHead key={heading}>{heading}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-16 text-center text-gray3">
                        No submitted products match your current filter.
                      </TableCell>
                    </TableRow>
                  )}

                  {visibleProducts.map((product: Product) => {
                    const statusLabel = getListingStatusMeta(product.status).label;
                    const image = product.images.find((item) => item.isDefault)?.url;

                    return (
                      <TableRow key={product._id}>
                        <TableCell className="min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div className="size-8 shrink-0 overflow-hidden rounded bg-gray5">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="size-full object-cover"
                                />
                              ) : null}
                            </div>
                            <span className="font-medium text-gray1">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(product.submittedAt ?? product.createdAt)}
                        </TableCell>
                        <TableCell>{getDistributorName(product.createdBy)}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{getProductStockTableValue(product)}</TableCell>
                        <TableCell>{formatMoney(product.pricePerUnit)}</TableCell>
                        <TableCell>
                          <span
                            className={`text-base font-normal ${getAdminTableStatusTextClass(product.status)}`}
                          >
                            {statusLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/admin/products/${product._id}`}
                            className="inline-flex items-center gap-2 text-base font-medium text-primary"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between text-sm text-gray3">
            <span>
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                title="Previous"
                variant="secondaryLight"
                size="sm"
                disabled={!hasPreviousPage}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="w-auto"
              />
              <Button
                title="Next"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="w-auto"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
