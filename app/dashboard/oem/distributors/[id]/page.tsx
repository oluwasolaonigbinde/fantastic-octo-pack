"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import Header from "../../../component/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchUserProducts } from "@/store/slices/product-slice";
import { fetchPublicProfileById } from "@/store/slices/user-slice";
import {
  buildDistributorVerificationSnapshot,
  getDistributorVerificationMeta,
} from "../../oem-ui";

export default function OemDistributorProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const dispatch = useAppDispatch();
  const selectedUser = useAppSelector((state) => state.user.selectedUser);
  const { myProducts, isLoading } = useAppSelector((state) => state.product);

  useEffect(() => {
    if (!id) {
      return;
    }

    dispatch(fetchPublicProfileById(id));
    dispatch(fetchUserProducts(id));
  }, [dispatch, id]);

  const distributorName = useMemo(() => {
    if (!selectedUser) {
      return "This is the name of the distributor";
    }

    return `${selectedUser.firstName} ${selectedUser.lastName}`.trim();
  }, [selectedUser]);
  const distributorEmail = useMemo(() => {
    if (!selectedUser || !("email" in selectedUser)) {
      return "Not publicly listed";
    }

    return (selectedUser as { email?: string }).email || "Not publicly listed";
  }, [selectedUser]);
  const verification = useMemo(
    () => buildDistributorVerificationSnapshot(myProducts ?? []),
    [myProducts],
  );
  const verificationMeta = useMemo(
    () => getDistributorVerificationMeta(verification.verificationStatus),
    [verification.verificationStatus],
  );

  return (
    <div>
      <Header title="Distributors" description="View all distributors" />

      <div className="space-y-4 bg-[#F8F9FA] p-4 md:p-6">
        <Link
          href="/dashboard/oem/distributors"
          className="inline-flex items-center gap-2 text-sm text-gray2"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="flex flex-col justify-between gap-4 rounded-[24px] border border-[#E8ECF4] bg-white p-6 md:p-8 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-14 shrink-0 rounded-full bg-gray6">
              <AvatarImage src={selectedUser?.displayPhoto?.url} alt={distributorName} />
              <AvatarFallback className="bg-[#EDF2FF] text-primary">
                {distributorName
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <h2 className="text-[28px] font-semibold leading-tight text-gray1">{distributorName}</h2>
          </div>

          <div
            className={`flex w-full flex-col gap-3 rounded-[20px] px-6 py-4 sm:w-auto sm:min-w-[280px] sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${verificationMeta.containerClassName}`}
          >
            <p className="shrink-0 text-sm text-gray2">Verification status</p>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${verificationMeta.chipClassName}`}
            >
              {verification.verificationStatus === "verified" && (
                <Check className="size-4 shrink-0 text-white" aria-hidden />
              )}
              {verificationMeta.label}
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-[24px] border border-[#E8ECF4] bg-white p-6 md:p-8 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
          <div className="border-b border-[#E8ECF4] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="mb-6 flex items-center gap-3">
              <Avatar className="size-10 shrink-0 rounded-full bg-gray6">
                <AvatarImage src={selectedUser?.displayPhoto?.url} alt={distributorName} />
                <AvatarFallback className="bg-[#EDF2FF] text-primary">
                  {distributorName
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-base font-medium text-gray2">OEM Branding</span>
            </div>

            <h3 className="text-xl font-semibold text-gray1">About Distributor</h3>
            <p className="mt-4 text-base leading-7 text-gray3 md:text-lg md:leading-8">
              {selectedUser?.bio || "Distributor profile description is not available yet."}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray1">Distributor&apos;s Information</h3>

            <div className="mt-6 space-y-6 text-base text-gray1 md:text-lg">
              <div>
                <p className="mb-1 text-sm text-gray3">Phone number:</p>
                <p className="font-normal">{selectedUser?.phoneNumber || "Not publicly listed"}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray3">Email address:</p>
                <p className="font-normal">{distributorEmail}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray3">Total product listed:</p>
                <p className="font-normal">{isLoading ? "..." : myProducts?.length ?? 0}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray3">Date verified:</p>
                <p className="font-normal">{verification.verificationDateLabel}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray3">Address:</p>
                <p className="font-normal">{selectedUser?.address || "Not publicly listed"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
