"use client";

import Link from "next/link";
import { Eye, MoveRight } from "lucide-react";

import { Button } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/types/product";

import {
  formatCompactDateTime,
  formatCurrency,
  getDistributorName,
  getOemStatusMeta,
  normalizeOemStatus,
} from "./oem-ui";

interface RecentListingRequestProps {
  products: Product[];
}

export default function RecentListingRequest({
  products,
}: RecentListingRequestProps) {
  const recent = [...products]
    .sort((left, right) => {
      const leftDate = new Date(left.submittedAt ?? left.createdAt).getTime();
      const rightDate = new Date(right.submittedAt ?? right.createdAt).getTime();
      return rightDate - leftDate;
    })
    .slice(0, 10);

  return (
    <section className="rounded-[24px] border border-[#E8ECF4] bg-white px-4 py-5 shadow-sm md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray1">Recent Listing Request</h2>
          <p className="text-sm text-gray3">Top 10 recent product listing request</p>
        </div>

        <Link href="/dashboard/oem/requests">
          <Button
            title="View All Request"
            size="md"
            iconRight={<MoveRight size={16} />}
            className="w-full rounded-2xl px-6 md:w-auto"
          />
        </Link>
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
            {recent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray3">
                  No listing request available yet.
                </TableCell>
              </TableRow>
            ) : (
              recent.map((product) => {
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
                    <TableCell>
                      <span className={`text-sm font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/oem/requests/${product._id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#2BA84A]"
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
    </section>
  );
}
