"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import { EmptyState, Spinner } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchPublicProfiles,
  resetUserState,
  type PublicProfileFilters,
} from "@/store/slices/user-slice";
import { UserRole } from "@/types/user";

import EngineerCard from "./EngineerCard";
import EngineerFilterSidebar, { EngineerFilters } from "./EngineerFilterSidebar";

const ENGINEERS_PER_PAGE = 9;

const EMPTY_FILTERS: EngineerFilters = {
  location: "",
  specialization: "",
  equipmentType: "",
  minimumRating: "",
  availability: "",
};

type EngineerSortBy = "" | "name-asc" | "name-desc";

const toApiFilters = (
  filters: EngineerFilters,
  sortBy: EngineerSortBy,
): PublicProfileFilters => {
  const query: PublicProfileFilters = {};
  if (filters.minimumRating) query.minRating = Number(filters.minimumRating);
  if (filters.specialization) query.specialization = filters.specialization;
  if (filters.equipmentType) query.equipmentType = filters.equipmentType;
  if (filters.location) query.location = filters.location;
  if (filters.availability === "available" || filters.availability === "busy") {
    query.availability = filters.availability;
  }
  if (sortBy) query.sortBy = sortBy;
  return query;
};

export default function ServiceEngineersPage() {
  const dispatch = useAppDispatch();
  const { users, pagination, facets, loading } = useAppSelector((state) => state.user);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState<EngineerFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<EngineerSortBy>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);

  const doFetch = useCallback(
    (
      page: number,
      searchValue: string,
      sidebarFilters: EngineerFilters,
      nextSortBy: EngineerSortBy,
    ) => {
      dispatch(
        fetchPublicProfiles({
          page,
          limit: ENGINEERS_PER_PAGE,
          roles: [UserRole.ENGINEER],
          search: searchValue || undefined,
          filters: toApiFilters(sidebarFilters, nextSortBy),
          includeFacets: true,
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(resetUserState());
    doFetch(1, "", EMPTY_FILTERS, "");
  }, [dispatch, doFetch]);

  const filterOptions = facets ?? {
    locations: [],
    specializations: [],
    equipmentTypes: [],
  };

  const totalResults = pagination?.totalDocs ?? users.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalResults / ENGINEERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const handleSearch = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
    doFetch(1, search, filters, sortBy);
  };

  const handleFilterChange = (nextFilters: EngineerFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
    setShowSidebar(false);
    doFetch(1, appliedSearch, nextFilters, sortBy);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    setShowSidebar(false);
    doFetch(1, appliedSearch, EMPTY_FILTERS, sortBy);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    doFetch(page, appliedSearch, filters, sortBy);
  };

  const handleSortChange = (value: EngineerSortBy) => {
    setSortBy(value);
    setCurrentPage(1);
    doFetch(1, appliedSearch, filters, value);
  };

  return (
    <PublicLayout
      banner={<Banner title="Service Engineers" />}
      contentClassName="min-h-screen bg-white"
    >
      <main className="mx-auto max-w-[1220px] px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
        <section className="rounded-[22px] border border-[#edf2f8] bg-white p-3 shadow-[0_10px_30px_rgba(15,37,79,0.04)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search engineers by name.."
                className="h-12 w-full rounded-[14px] border border-[#e3ebf5] px-4 text-sm text-[#1f2f4a] outline-none transition focus:border-[#9ec7f2]"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-[#9fd0fb] bg-[#eaf6ff] px-5 text-sm font-semibold text-[#0669d9] transition hover:bg-[#dff0ff]"
            >
              <Search size={16} />
              Search
            </button>
          </div>
        </section>

        <div className="mt-5 lg:hidden">
          <button
            type="button"
            onClick={() => setShowSidebar((prev) => !prev)}
            className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#dbe8f7] bg-[#f7fbff] px-4 text-sm font-semibold text-[#244268]"
          >
            <SlidersHorizontal size={15} />
            {showSidebar ? "Hide filters" : "Filter"}
          </button>
        </div>

        <section className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className={`${showSidebar ? "block" : "hidden"} lg:block`}>
            <EngineerFilterSidebar
              locations={filterOptions.locations}
              specializations={filterOptions.specializations}
              equipmentTypes={filterOptions.equipmentTypes}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[#4e6079]">{totalResults} Results Found</p>
              <div className="flex items-center gap-3 text-sm">
                <label htmlFor="engineer-sort" className="text-[#7a889c]">
                  Sort by
                </label>
                <select
                  id="engineer-sort"
                  value={sortBy}
                  onChange={(event) =>
                    handleSortChange(event.target.value as EngineerSortBy)
                  }
                  className="h-10 rounded-[12px] border border-[#e3ebf5] bg-white px-3 text-[#244268] outline-none"
                >
                  <option value="">Default</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                title="No engineers found"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <>
                <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {users.map((engineer) => (
                    <EngineerCard key={engineer._id} engineer={engineer} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="rounded-[12px] border border-[#e3ebf5] px-5 py-2 text-sm font-medium text-[#53647d] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[#73839a]">
                      Page {safeCurrentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="rounded-[12px] border border-[#e3ebf5] px-5 py-2 text-sm font-medium text-[#53647d] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
