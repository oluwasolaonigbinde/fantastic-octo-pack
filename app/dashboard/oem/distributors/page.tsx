"use client";

import { useMemo } from "react";

import Header from "../../component/header";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useOemListingRequestsQuery } from "@/hooks/queries/products";

import AllDistributors from "./AllDistributors";
import { buildDistributorSummaries, buildDistributorVerificationCounts } from "../oem-ui";

export default function OEMDistributor() {
  const { data: authData } = useAppSelector((state) => state.auth);
  const { data: oemListing, isLoading } = useOemListingRequestsQuery(
    { assignedOem: authData?._id, populate: "createdBy" },
    { enabled: Boolean(authData?._id && authData?.tokens?.accessToken) },
  );
  const oemListingRequests = oemListing?.requests ?? null;

  const distributors = useMemo(
    () => buildDistributorSummaries(oemListingRequests ?? []),
    [oemListingRequests],
  );
  const verificationCounts = useMemo(
    () => buildDistributorVerificationCounts(distributors),
    [distributors],
  );

  return (
    <>
      <Header title="Distributors" description="View all distributors" />

      <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
        <section className="rounded-[24px] border border-[#E8ECF4] bg-white px-4 py-5 shadow-sm md:px-6">
          <h2 className="text-[32px] font-semibold leading-none text-gray1">
            {distributors.length}
          </h2>
          <p className="mt-3 text-sm text-gray2">Total distributors</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray3">
            <span className="border-r border-[#D7DEEA] pr-3">
              Verified: {verificationCounts.verified}
            </span>
            <span>Not verified: {verificationCounts.pending}</span>
          </div>
        </section>

        <AllDistributors distributors={distributors} loading={isLoading} />
      </div>
    </>
  );
}
