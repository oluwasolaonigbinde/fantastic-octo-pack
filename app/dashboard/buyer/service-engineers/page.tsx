"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Filter,
  Star,
} from "lucide-react";

import { Button, Spinner, EmptyState } from "@/components/base";
import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchPublicProfiles,
  resetUserState,
  type PublicProfileFilters,
} from "@/store/slices/user-slice";
import { UserRole, type PublicProfileData } from "@/types/user";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatPhoneDisplay(phone?: string): string {
  if (!phone?.trim()) return "No phone number";
  const p = phone.trim();
  if (p.startsWith("+234")) {
    const rest = p.slice(4).replace(/\D/g, "");
    if (rest.length >= 9 && rest.length <= 10 && !rest.startsWith("0")) {
      return `0${rest}`;
    }
    if (rest.startsWith("0")) return rest;
  }
  return p;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Engineer card (buyer-dashboard variant)                            */
/* ------------------------------------------------------------------ */

function BuyerEngineerCard({ engineer }: { engineer: PublicProfileData }) {
  const router = useRouter();
  const fullName = `${engineer.firstName} ${engineer.lastName}`;
  const busy = engineer.engineerAvailability === "busy";
  const verified = Boolean(engineer.oemCertified);
  const primarySpec = engineer.specializations?.[0];
  const extraSpecs = (engineer.specializations?.length ?? 0) - 1;

  return (
    <div className="relative h-[198px] rounded-2xl border border-[#DDE0E5] bg-white overflow-hidden">

      {/* Left section: image + info rows — x=20, y=20 */}
      <div className="absolute left-5 top-5 flex flex-row items-center gap-[13px]">
        {/* Photo */}
        <div className="w-[158px] h-[158px] rounded-[4px] overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
          {engineer.displayPhoto?.url ? (
            <Image
              src={engineer.displayPhoto.url}
              alt={fullName}
              width={158}
              height={158}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-lg font-semibold text-slate-500">
              {getInitials(engineer.firstName, engineer.lastName)}
            </span>
          )}
        </div>

        {/* Info: 3 rows with per-row gaps matching Figma */}
        <div className="flex flex-col justify-center gap-[17px]">
          {/* Row 1: name | phone — gap 89px */}
          <div className="flex flex-row items-center gap-[89px]">
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">Name of engineer</p>
              <p className="text-sm text-[#111827]">{fullName}</p>
            </div>
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">Phone number</p>
              <p className="text-sm text-[#111827]">{formatPhoneDisplay(engineer.phoneNumber)}</p>
            </div>
          </div>

          {/* Row 2: OEM certified | location — gap 111px */}
          <div className="flex flex-row gap-[111px]">
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">OEM certified</p>
              {verified ? (
                <div className="flex items-center gap-1 text-sm text-[#111827]">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                  Verified
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF]">Not certified</p>
              )}
            </div>
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">Location</p>
              <p className="text-sm text-[#111827]">
                {engineer.address || <span className="italic text-[#9CA3AF]">Not specified</span>}
              </p>
            </div>
          </div>

          {/* Row 3: specialization | ratings — gap 70px */}
          <div className="flex flex-row gap-[70px]">
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">Specialization</p>
              <p className="text-sm text-[#111827]">
                {primarySpec ?? <span className="text-[#9CA3AF]">—</span>}
                {extraSpecs > 0 && (
                  <span className="ml-1 text-xs text-[#017BED]">+ {extraSpecs} more</span>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-[2px]">
              <p className="text-[12px] leading-[17px] text-[#6B7280]">Ratings</p>
              <div>
                {typeof engineer.rating === "number" ? (
                  <StarRating rating={engineer.rating} />
                ) : (
                  <span className="text-xs text-[#9CA3AF]">No ratings yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability status — absolute top-right (x=887, y=20), left-aligned with button */}
      <div className="absolute top-5 right-5 w-[250px] flex flex-col gap-[2px]">
        <p className="text-sm text-[#6B7280]">Availability status</p>
        <span className={`text-base font-semibold tracking-wide ${busy ? "text-[#FE6E00]" : "text-[#13A83B]"}`}>
          {busy ? "BUSY" : "AVAILABLE"}
        </span>
      </div>

      {/* Request service button — absolute bottom-right (x=890, y=118) */}
      <Button
        title="Request service"
        variant="primary"
        size="sm"
        disabled={busy}
        iconRight={busy ? undefined : <ArrowRight size={14} />}
        onClick={() => router.push(`/service-engineers/profile?id=${engineer._id}`)}
        className={`absolute bottom-5 right-5 w-[250px] h-[60px]! rounded-xl! ${
          busy
            ? "bg-[#DDE0E5]! text-[#6B7280]! border-none! cursor-not-allowed!"
            : "bg-[#0669D9]! hover:bg-[#0558b8]! text-white! border-none!"
        }`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function BuyerServiceEngineersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { users, loading } = useAppSelector((s) => s.user);

  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");

  const doFetch = useCallback(
    (filters: PublicProfileFilters) => {
      dispatch(
        fetchPublicProfiles({
          page: 1,
          limit: 100,
          roles: [UserRole.ENGINEER],
          filters,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(resetUserState());
    doFetch({});
  }, [dispatch, doFetch]);

  // Filter options derived from current user list (single fetch, no re-fetch)
  const filterOptions = useMemo(() => {
    const locations = [
      ...new Set(
        users.map((e) => e.address).filter((a): a is string => !!a)
      ),
    ];
    const serviceTypes = [
      ...new Set(users.flatMap((e) => e.specializations ?? [])),
    ];
    return { locations, serviceTypes };
  }, [users]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = [...users];

    if (availabilityFilter === "available") {
      result = result.filter((e) => e.engineerAvailability !== "busy");
    } else if (availabilityFilter === "busy") {
      result = result.filter((e) => e.engineerAvailability === "busy");
    }

    if (locationFilter) {
      result = result.filter((e) =>
        e.address?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (serviceTypeFilter) {
      result = result.filter((e) =>
        e.specializations?.some(
          (s) => s.toLowerCase() === serviceTypeFilter.toLowerCase()
        )
      );
    }

    return result;
  }, [users, availabilityFilter, locationFilter, serviceTypeFilter]);

  const handleReset = () => {
    setLocationFilter("");
    setAvailabilityFilter("");
    setServiceTypeFilter("");
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUYER}>
      <div>
        <Header
          title="Service Requests"
          description="View all service requests"
        />

        <div className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-3 md:p-6">
          {/* Go Back */}
          <button
            type="button"
            onClick={() => router.push("/dashboard/buyer/service-request")}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </button>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#111827]">
              All Service Engineers
            </h2>
          </div>

          {/* Filters */}
          <section className="mb-5 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs text-[#6B7280]">Filter table list by:</p>
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#111827]">Location</label>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#C4C8CE]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#111827]">Status badge</label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className={`h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm outline-none ${availabilityFilter === "" ? "text-[#C4C8CE]" : "text-[#111827]"}`}
                >
                  <option value="">Select available status</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#111827]">Service type</label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className={`h-[60px] w-[250px] rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm outline-none ${serviceTypeFilter === "" ? "text-[#C4C8CE]" : "text-[#111827]"}`}
                >
                  <option value="">Enter specialization</option>
                  {filterOptions.serviceTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="button"
                  className="inline-flex h-[60px] w-[250px] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white"
                >
                  <Filter className="size-4" aria-hidden />
                  Filter
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-[60px] px-4 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* Engineer list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner showLoadingText />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No engineers found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((engineer) => (
                <BuyerEngineerCard key={engineer._id} engineer={engineer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
