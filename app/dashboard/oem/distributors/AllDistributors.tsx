"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, SlidersHorizontal } from "lucide-react";

import { Button, Input, SingleSelect } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  buildCountryLabel,
  getDistributorVerificationMeta,
  type OemDistributorSummary,
} from "../oem-ui";

interface AllDistributorsProps {
  distributors: OemDistributorSummary[];
  loading: boolean;
}

const PAGE_SIZE = 10;

export default function AllDistributors({
  distributors,
  loading,
}: AllDistributorsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [distributorNameFilter, setDistributorNameFilter] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const filtered = useMemo(() => {
    return distributors.filter((distributor) => {
      const matchesName = distributorNameFilter
        ? distributor.name.toLowerCase().includes(distributorNameFilter.toLowerCase())
        : true;
      const matchesStatus = verificationStatus
        ? distributor.verificationStatus === verificationStatus
        : true;

      return matchesName && matchesStatus;
    });
  }, [distributors, distributorNameFilter, verificationStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <section className="rounded-[24px] border border-[#E8ECF4] bg-white px-4 py-6 shadow-sm md:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray1">All Distributors</h2>
        <p className="text-sm text-gray3">Total list of all distributors listed under you</p>
      </div>

      <div className="mb-6">
        <p className="mb-4 text-sm font-medium text-gray2">Filter table list by:</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Input
            id="oem-distributor-filter"
            label="Distributor name"
            placeholder="Enter product name"
            value={distributorNameFilter}
            onValueChange={setDistributorNameFilter}
            maxWidth="sm:w-[220px]"
          />
          <SingleSelect
            value={verificationStatus}
            label="Verification status"
            onValueChange={(value) => {
              setVerificationStatus(value);
              setCurrentPage(1);
            }}
            placeholder="Select option"
            options={[
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
            ]}
            maxWidth="sm:w-[200px]"
          />
          <Button
            title="Filter"
            size="md"
            iconLeft={<SlidersHorizontal className="size-4" />}
            className="h-[var(--control-height-lg)] w-full rounded-2xl px-8 sm:w-auto"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Distributor name",
                "Date verified",
                "Listed request",
                "Status",
                "Country of delivery",
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-gray3">
                  Loading distributors...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-gray3">
                  No distributors match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((distributor) => {
                const status = getDistributorVerificationMeta(distributor.verificationStatus);

                return (
                  <TableRow key={distributor.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-7 rounded-md bg-gray5" />
                        <span>{distributor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {distributor.verificationDateLabel}
                    </TableCell>
                    <TableCell>{distributor.totalRequests}</TableCell>
                    <TableCell className={`text-sm font-medium ${status.className}`}>
                      {status.label}
                    </TableCell>
                    <TableCell>{buildCountryLabel(distributor.countries)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/oem/distributors/${distributor.id}`}
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

      <div className="mt-6 flex items-center gap-3 text-sm text-gray2">
        <span>Page</span>
        <span className="inline-flex h-10 items-center rounded-xl border border-gray5 px-4 text-gray1">
          {currentPage}
        </span>
        <span>of {totalPages}</span>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="ml-4 inline-flex size-10 items-center justify-center rounded-xl border border-gray5 text-gray1 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous distributor page"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next distributor page"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
