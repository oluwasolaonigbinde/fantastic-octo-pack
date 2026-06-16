"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileInput,
  SlidersHorizontal,
  Truck,
  type LucideIcon,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, SingleSelect } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOemListingRequests } from "@/store/slices/product-slice";

import {
  buildCategoryBreakdown,
  formatCompactDateTime,
  formatCurrency,
  getDistributorName,
  getOemStatusMeta,
  normalizeOemStatus,
} from "../oem-ui";

const PAGE_SIZE = 10;

export default function OemListingRequests() {
  const dispatch = useAppDispatch();
  const { data: authData } = useAppSelector((state) => state.auth);
  const { oemListingRequests, isLoading } = useAppSelector((state) => state.product);

  const [currentPage, setCurrentPage] = useState(1);
  const [distributorName, setDistributorName] = useState("");
  const [productName, setProductName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (authData?._id && authData?.tokens?.accessToken) {
      dispatch(
        fetchOemListingRequests({
          assignedOem: authData._id,
          token: authData.tokens.accessToken,
          populate: "createdBy",
        }),
      );
    }
  }, [dispatch, authData?._id, authData?.tokens?.accessToken]);

  const products = useMemo(() => oemListingRequests ?? [], [oemListingRequests]);
  const approvedProducts = useMemo(
    () => products.filter((product) => normalizeOemStatus(product.oemApprovalStatus) === "approved"),
    [products],
  );
  const pendingProducts = useMemo(
    () => products.filter((product) => normalizeOemStatus(product.oemApprovalStatus) === "pending"),
    [products],
  );

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const distributor = getDistributorName(product.createdBy).toLowerCase();
      const productLabel = product.name.toLowerCase();
      const status = normalizeOemStatus(product.oemApprovalStatus);

      const matchesDistributor = distributorName
        ? distributor.includes(distributorName.toLowerCase())
        : true;
      const matchesProduct = productName
        ? productLabel.includes(productName.toLowerCase())
        : true;
      const matchesStatus = statusFilter ? status === statusFilter : true;
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;

      return matchesDistributor && matchesProduct && matchesStatus && matchesCategory;
    });
  }, [products, distributorName, productName, statusFilter, categoryFilter]);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const totalBreakdown = buildCategoryBreakdown(products);
  const approvedBreakdown = buildCategoryBreakdown(approvedProducts);
  const pendingBreakdown = buildCategoryBreakdown(pendingProducts);

  return (
    <div>
      <Header
        title="Listing Request"
        description="View all, approve or deny all product listing request"
      />

      <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
        <section className="grid gap-4 lg:grid-cols-3">
          {(
            [
              {
                label: "Total listing request",
                value: products.length,
                breakdown: totalBreakdown,
                Icon: Truck,
                iconBgClass: "bg-[#E2F1FF]",
                iconColorClass: "text-[#017BED]",
              },
              {
                label: "Total approved request",
                value: approvedProducts.length,
                breakdown: approvedBreakdown,
                Icon: FileInput,
                iconBgClass: "bg-[#DEFFE7]",
                iconColorClass: "text-[#13A83B]",
              },
              {
                label: "Total pending listing",
                value: pendingProducts.length,
                breakdown: pendingBreakdown,
                Icon: FileInput,
                iconBgClass: "bg-[#FFF6D9]",
                iconColorClass: "text-[#FFC000]",
              },
            ] satisfies {
              label: string;
              value: number;
              breakdown: ReturnType<typeof buildCategoryBreakdown>;
              Icon: LucideIcon;
              iconBgClass: string;
              iconColorClass: string;
            }[]
          ).map((card) => (
            <div
              key={card.label}
              className="rounded-[20px] border border-[#E8ECF4] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray3">{card.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold leading-none text-gray1">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg p-2.5 ${card.iconBgClass}`}
                >
                  <card.Icon
                    className={`size-6 stroke-[1.75] ${card.iconColorClass}`}
                    aria-hidden
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center text-sm text-gray3">
                {card.breakdown.map((item, index) => (
                  <span key={item.label} className="flex items-center">
                    {index > 0 ? (
                      <span
                        className="mx-3 h-2 w-px shrink-0 bg-[#D7DEEA]"
                        aria-hidden
                      />
                    ) : null}
                    <span>
                      {item.label}: {item.value}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[24px] border border-[#E8ECF4] bg-white px-4 py-6 shadow-sm md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray1">All Listing Request</h2>
            <p className="text-sm text-gray3">Total product listing request</p>
          </div>

          <div className="mb-8">
            <p className="mb-4 text-sm font-medium text-gray2">Filter table list by:</p>
            <div className="grid gap-4 lg:grid-cols-4">
              <Input
                id="oem-distributor-name"
                label="Distributor name"
                placeholder="Enter distributor name"
                value={distributorName}
                onValueChange={(value) => {
                  setDistributorName(value);
                  setCurrentPage(1);
                }}
              />
              <Input
                id="oem-product-name"
                label="Product name"
                placeholder="Enter product name"
                value={productName}
                onValueChange={(value) => {
                  setProductName(value);
                  setCurrentPage(1);
                }}
              />
              <SingleSelect
                label="Verification status"
                placeholder="Select status"
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <SingleSelect
                label="Product category"
                placeholder="Select category"
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
                options={categories.map((category) => ({
                  value: category,
                  label: category,
                }))}
              />
            </div>

            <div className="mt-4 max-w-[220px]">
              <Button
                title="Filter"
                size="md"
                iconLeft={<SlidersHorizontal className="size-4" />}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Distributors' name",
                    "Product's name",
                    "Category",
                    "Price",
                    "Date of request",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <TableHead
                      key={heading}
                      className="whitespace-nowrap py-3 text-sm font-medium text-gray3"
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray3">
                      Loading listing request...
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray3">
                      No listing request matches the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((product) => {
                    const status = normalizeOemStatus(product.oemApprovalStatus);
                    const statusMeta = getOemStatusMeta(status);

                    return (
                      <TableRow key={product._id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="size-7 rounded-md bg-gray5" />
                            <span>{getDistributorName(product.createdBy)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatCurrency(product.pricePerUnit)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatCompactDateTime(product.submittedAt ?? product.createdAt)}
                        </TableCell>
                        <TableCell className={`text-sm font-medium ${statusMeta.className}`}>
                          {statusMeta.label}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/oem/requests/${product._id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-gray2">
            <span>Page</span>
            <span className="rounded-xl border border-gray5 px-4 py-2 text-gray1">
              {currentPage}
            </span>
            <span>of {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-gray5 p-2 text-gray1 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous request page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl bg-primary p-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next request page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
