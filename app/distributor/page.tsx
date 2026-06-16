"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import Image from "next/image";
import { Button, Input, SingleSelect } from "@/components/base";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchPublicProfiles,
  resetUserState,
} from "@/store/slices/user-slice";
import type { PublicProfileData } from "@/types/user";
import { UserRole } from "@/types/user";

const DISTRIBUTORS_PER_PAGE = 10;

type DirectoryRoleFilter = "" | UserRole.DISTRIBUTOR | UserRole.OEM;

const rolesForFilter = (
  role: DirectoryRoleFilter,
): Array<UserRole.DISTRIBUTOR | UserRole.OEM> => {
  if (role === UserRole.DISTRIBUTOR) {
    return [UserRole.DISTRIBUTOR];
  }

  if (role === UserRole.OEM) {
    return [UserRole.OEM];
  }

  return [UserRole.DISTRIBUTOR, UserRole.OEM];
};

export default function DistributorPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { users, pagination, loading } = useAppSelector((state) => state.user);
  
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterType, setFilterType] = useState<DirectoryRoleFilter>("");
  const [currentPage, setCurrentPage] = useState(1);

  const getCompanyDisplayName = (company: PublicProfileData) => {
    const companyName = [company.firstName, company.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (companyName) {
      return companyName;
    }

    return company.role?.toLowerCase() === "oem"
      ? "OEM account"
      : "Distributor account";
  };

  const fetchDirectoryPage = useCallback(
    (page: number, searchValue: string, roleValue: DirectoryRoleFilter) => {
      dispatch(
        fetchPublicProfiles({
          page,
          limit: DISTRIBUTORS_PER_PAGE,
          roles: rolesForFilter(roleValue),
          search: searchValue || undefined,
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(resetUserState());
    fetchDirectoryPage(1, "", "");
  }, [dispatch, fetchDirectoryPage]);

  const totalPages = pagination?.totalPages ?? 0;
  const backendPage = pagination?.page ?? currentPage;
  const safeCurrentPage =
    totalPages > 0 ? Math.min(backendPage, totalPages) : 1;
  const hasPreviousPage = Boolean(pagination?.hasPreviousPage);
  const hasNextPage = Boolean(pagination?.hasNextPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setAppliedSearch(value);
    setCurrentPage(1);
    fetchDirectoryPage(1, value, filterType);
  };

  const handleRoleChange = (value: string) => {
    const nextRole =
      value === UserRole.DISTRIBUTOR || value === UserRole.OEM
        ? value
        : "";
    setFilterType(nextRole);
    setCurrentPage(1);
    fetchDirectoryPage(1, appliedSearch, nextRole);
  };

  const handleClear = () => {
    setSearch("");
    setAppliedSearch("");
    setFilterType("");
    setCurrentPage(1);
    fetchDirectoryPage(1, "", "");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDirectoryPage(page, appliedSearch, filterType);
  };

  return (
    <PublicLayout
      banner={<Banner title="Distributors & OEMs" />}
      contentClassName="flex flex-col min-h-screen"
    >
      <main className="flex-1 bg-white p-4 sm:p-6 md:p-10">
        <div className="max-w-6xl mx-auto w-full">
          <p className="text-gray-700 text-sm mb-2 font-medium">
            Filter distributor/OEM list by:
          </p>

          {/* Filter Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-8 w-full">
            <Input
              type="text"
              label="Search"
              placeholder="Search name"
              value={search}
              onValueChange={handleSearchChange}
              className="w-full md:flex-1"
            />

            <SingleSelect
              label="Role"
              placeholder="Select role"
              value={filterType}
              onValueChange={handleRoleChange}
              options={[
                { label: "Distributor", value: "distributor" },
                { label: "OEM", value: "oem" },
              ]}
              className="w-full md:w-auto"
            />

            <Button
              onClick={handleClear}
              title="Clear"
              variant="secondaryLight"
              size="sm"
              className="w-full sm:w-auto rounded-lg mt-6 px-6"
            />
          </div>

          {/* Loading */}
          {loading && (
            <p className="text-center text-gray-500 py-10">Loading users...</p>
          )}

          {/* Company Cards */}
          {!loading && (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
              {users.map((company) => ( 
                <div
                  key={company._id}
                  className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 border border-gray-100 hover:shadow-md transition"
                >
                  <div className="w-full sm:w-24 sm:h-32 rounded-lg overflow-hidden">
                    <Image
                      src={company.displayPhoto?.url || "/images/profile.webp"}
                      alt={getCompanyDisplayName(company)}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <div className="flex flex-col flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {getCompanyDisplayName(company)}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                      <span
                        className={`font-semibold ${
                          company.role === "oem"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        {company.role?.toUpperCase() || "ACCOUNT"}
                      </span>

                      <span>• {company.phoneNumber || "No phone number"}</span>
                      <span>• {company.address || "No address"}</span>
                    </div>

                    <Button
                      onClick={() =>
                        router.push(
                          company.role?.toLowerCase() === "oem"
                            ? `/distributor/oem-profile?id=${company._id}`
                            : `/distributor/profile?id=${company._id}`
                        )
                      }
                      title="Check Profile"
                      variant="primary"
                      size="sm"
                      className="w-34! mt-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && users.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, backendPage - 1))}
                disabled={!hasPreviousPage}
                className="rounded-[12px] border border-[#e3ebf5] px-5 py-2 text-sm font-medium text-[#53647d] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[#73839a]">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, backendPage + 1))
                }
                disabled={!hasNextPage}
                className="rounded-[12px] border border-[#e3ebf5] px-5 py-2 text-sm font-medium text-[#53647d] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && users.length === 0 && (
            <p className="text-center text-gray-500 mt-10">
              No users match your search/filter.
            </p>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}
