"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { Product } from "@/types/product";
import SafeProductImage from "@/components/product/SafeProductImage";
import {
  getProductDefaultImageUrl,
  getProductStockTableValue,
} from "@/utils/productDisplay";
import { getListingStatusMeta } from "@/utils/productStatus";
import { EmptyState, Skeleton } from "@/components/base";

type DashboardProductRow = Product & Partial<{
  price: number;
  quantity: number;
  stock: number;
  quantityInStock: number;
}>;

function formatNaira(amount: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "--";
  }

  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `₦${formatted}`;
}

function toSentenceCase(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

function getDisplayPrice(product: DashboardProductRow): number | null {
  if (
    typeof product.pricePerUnit === "number" &&
    Number.isFinite(product.pricePerUnit)
  ) {
    return product.pricePerUnit;
  }

  if (typeof product.price === "number" && Number.isFinite(product.price)) {
    return product.price;
  }

  return null;
}

function getDisplayStock(product: DashboardProductRow): string {
  const stockValue = getProductStockTableValue(product);

  if (stockValue !== "--") {
    return stockValue;
  }

  const fallbackQuantity = [
    product.quantity,
    product.quantityInStock,
    product.stock,
  ].find((value) => typeof value === "number" && Number.isFinite(value));

  return typeof fallbackQuantity === "number" ? String(fallbackQuantity) : "--";
}

function statusTextClassName(status: Product["status"]): string {
  switch (status) {
    case "pending":
      return "text-[#FFC000]";
    case "approved":
      return "text-[#13A83B]";
    default:
      return "text-[#111827]";
  }
}

function sortRecentProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return tb - ta;
  });
}

export function DistributorRecentProductsTable({
  products,
  isLoading,
  roleSegment,
}: {
  products: Product[] | null | undefined;
  isLoading: boolean;
  roleSegment: string;
}) {
  const router = useRouter();
  const rows = useMemo(() => {
    if (!products?.length) return [];
    return sortRecentProducts(products).slice(0, 10);
  }, [products]);

  if (isLoading) {
    return (
      <div className="max-h-[364px] overflow-y-auto">
        <Skeleton className="mb-2 h-16" />
        <Skeleton className="mb-2 h-16" />
        <Skeleton className="mb-2 h-16" />
        <Skeleton className="mb-2 h-16" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="You have no products yet"
        description="Add a draft product to see it appear in your catalogue."
      />
    );
  }

  return (
    <div className="max-h-[364px] overflow-y-auto">
      <Table>
        <TableHeader className="text-[#6B7280]">
          <TableRow className="h-11 border-b border-[#F3F4F6]">
            <TableHead className="text-sm font-medium">Product name</TableHead>
            <TableHead className="text-sm font-medium">Price</TableHead>
            <TableHead className="text-sm font-medium">
              Quantity in stock
            </TableHead>
            <TableHead className="text-sm font-medium">Status</TableHead>
            <TableHead className="text-sm font-medium">Category</TableHead>
            <TableHead className="text-sm font-medium">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((product, idx) => {
            const dashboardProduct = product as DashboardProductRow;
            const meta = getListingStatusMeta(product.status);
            const canOpenProduct = Boolean(product._id);

            return (
              <TableRow
                key={product._id ?? `recent-${idx}`}
                className="h-12 border-b border-[#F3F4F6]"
              >
                <TableCell className="flex items-center gap-2 font-normal text-black">
                  <SafeProductImage
                    src={getProductDefaultImageUrl(product)}
                    alt={product.name}
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-lg bg-[#D9D9D9]"
                  />
                  <span className="line-clamp-2">{product.name}</span>
                </TableCell>
                <TableCell className="font-normal text-black">
                  {formatNaira(getDisplayPrice(dashboardProduct))}
                </TableCell>
                <TableCell className="font-normal text-black">
                  {getDisplayStock(dashboardProduct)}
                </TableCell>
                <TableCell
                  className={`font-normal ${statusTextClassName(product.status)}`}
                >
                  {meta.label}
                </TableCell>
                <TableCell className="font-normal text-black">
                  {toSentenceCase(product.category)}
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-6">
                    <button
                      type="button"
                      aria-label={`View ${product.name}`}
                      className="text-[#13A83B] hover:opacity-80"
                      onClick={() =>
                        router.push(
                          `/dashboard/${roleSegment}/catalogue/${product._id}`,
                        )
                      }
                    >
                      <Eye className="size-6" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${product.name}`}
                      disabled={!canOpenProduct}
                      className={
                        canOpenProduct
                          ? "text-[#0669D9] hover:opacity-80"
                          : "cursor-not-allowed text-gray5"
                      }
                      onClick={() => {
                        if (!canOpenProduct) return;
                        router.push(
                          `/dashboard/${roleSegment}/catalogue/${product._id}`,
                        );
                      }}
                    >
                      <Pencil className="size-6" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
