"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import FilterSidebar, {
  FilterCounts,
  FilterCriteria,
} from "./FilterSidebar";
import FilterChipBar from "./FilterChipBar";
import ProductGrid from "./ProductGrid";

import { useProductsQuery } from "@/hooks/queries/products";

import { BigLoader } from "@/components/base";
import { Product } from "@/types/product";
import { isProductAvailable } from "@/utils/productDisplay";
import SearchAutocomplete from "@/components/features/search/SearchAutocomplete";

const CATEGORY_OPTIONS = [
  "equipment",
  "consumables",
  "instruments",
  "accessories",
  "spare parts",
] as const;

const EMPTY_FILTERS: FilterCriteria = {
  category: null,
  oem: null,
  distributor: null,
  minPrice: undefined,
  maxPrice: undefined,
  amount: undefined,
  availability: null,
};

const ProductPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cached read: on remount this serves instantly and revalidates in the
  // background instead of re-showing a spinner. Client-side faceting below
  // still needs the full set, so we keep the wide `limit` for now — moving to
  // server-side pagination is tracked as a separate follow-up.
  const {
    data,
    isLoading,
    isError,
    error,
  } = useProductsQuery({ populate: "createdBy", limit: 1000 });

  const products = data?.products ?? null;
  const message = error instanceof Error ? error.message : "";

  const normalizeCategory = useCallback((cat?: string | null) => {
    if (!cat || cat === "all") return null;
    const key = cat.toLowerCase().trim();
    return CATEGORY_OPTIONS.find((value) => value === key) ?? null;
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("");
  const [filters, setFilters] = useState<FilterCriteria>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");

  const productsPerPage = 9;

  useEffect(() => {
    const nextFilters: FilterCriteria = {
      ...EMPTY_FILTERS,
      category: normalizeCategory(searchParams.get("category")),
    };

    queueMicrotask(() => {
      setFilters(nextFilters);
      setSearchQuery(searchParams.get("search") ?? "");
      setCurrentPage(1);
    });
  }, [normalizeCategory, searchParams]);

  const getRole = useCallback((product: Product) => {
    if (typeof product.createdBy !== "object") return null;
    return product.createdBy.role?.toLowerCase() ?? null;
  }, []);

  const getEffectiveMaxPrice = useCallback((criteria: FilterCriteria) => {
    const amountCap =
      typeof criteria.amount === "number"
        ? criteria.amount
        : Number.POSITIVE_INFINITY;
    const sliderCap =
      typeof criteria.maxPrice === "number"
        ? criteria.maxPrice
        : Number.POSITIVE_INFINITY;
    const result = Math.min(amountCap, sliderCap);
    return Number.isFinite(result) ? result : null;
  }, []);

  const matchesFilters = useCallback(
    (
      product: Product,
      criteria: FilterCriteria,
      ignore?: keyof Pick<
        FilterCriteria,
        "category" | "oem" | "distributor" | "availability"
      >
    ) => {
      const categoryKey = product.category.toLowerCase().trim();
      const role = getRole(product);
      const effectiveMaxPrice = getEffectiveMaxPrice(criteria);

      if (
        ignore !== "category" &&
        criteria.category &&
        categoryKey !== criteria.category
      ) {
        return false;
      }

      if (ignore !== "oem" && criteria.oem && role !== criteria.oem) {
        return false;
      }

      if (
        ignore !== "distributor" &&
        criteria.distributor &&
        role !== criteria.distributor
      ) {
        return false;
      }

      if (ignore !== "availability") {
        if (
          criteria.availability === "available" &&
          !isProductAvailable(product)
        ) {
          return false;
        }

        if (
          criteria.availability === "unavailable" &&
          isProductAvailable(product)
        ) {
          return false;
        }
      }

      if (
        typeof criteria.minPrice === "number" &&
        product.pricePerUnit < criteria.minPrice
      ) {
        return false;
      }

      if (
        typeof effectiveMaxPrice === "number" &&
        product.pricePerUnit > effectiveMaxPrice
      ) {
        return false;
      }

      return true;
    },
    [getEffectiveMaxPrice, getRole]
  );

  const filteredProducts = useMemo(() => {
    const docs = products ?? [];
    const searchLower = searchQuery.trim().toLowerCase();
    return docs.filter((product) => {
      if (!matchesFilters(product, filters)) return false;
      if (searchLower) {
        const name = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        const brand = (product.brand_oem ?? "").toLowerCase();
        if (
          !name.includes(searchLower) &&
          !category.includes(searchLower) &&
          !brand.includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filters, matchesFilters, products, searchQuery]);

  const filterCounts = useMemo<FilterCounts>(() => {
    const docs = products ?? [];

    const categoryBase = docs.filter((product) =>
      matchesFilters(product, filters, "category")
    );
    const oemBase = docs.filter((product) =>
      matchesFilters(product, filters, "oem")
    );
    const distributorBase = docs.filter((product) =>
      matchesFilters(product, filters, "distributor")
    );
    const availabilityBase = docs.filter((product) =>
      matchesFilters(product, filters, "availability")
    );

    const categories = CATEGORY_OPTIONS.reduce<Record<string, number>>(
      (acc, category) => {
        acc[category] = categoryBase.filter(
          (product) => product.category.toLowerCase().trim() === category
        ).length;
        return acc;
      },
      { all: categoryBase.length }
    );

    return {
      categories,
      oem: {
        all: oemBase.length,
        oem: oemBase.filter((product) => getRole(product) === "oem").length,
      },
      distributor: {
        all: distributorBase.length,
        distributor: distributorBase.filter(
          (product) => getRole(product) === "distributor"
        ).length,
      },
        availability: {
          all: availabilityBase.length,
          available: availabilityBase.filter(
            (product) => isProductAvailable(product)
          ).length,
          unavailable: availabilityBase.filter(
            (product) => !isProductAvailable(product)
          ).length,
        },
      };
  }, [filters, getRole, matchesFilters, products]);

  const filteredTotal = filteredProducts.length;
  const computedTotalPages = Math.max(
    1,
    Math.ceil(filteredTotal / productsPerPage)
  );
  const safeCurrentPage = Math.min(currentPage, computedTotalPages);

  const currentProducts = useMemo(() => {
    const docs = filteredProducts ?? [];

    const sorted = [...docs].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.pricePerUnit - b.pricePerUnit;
        case "price-desc":
          return b.pricePerUnit - a.pricePerUnit;
        case "newest":
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          return dateA.getTime() - dateB.getTime();
        default:
          return 0;
      }
    });

    const startIndex = (safeCurrentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;

    return sorted.slice(startIndex, endIndex);
  }, [filteredProducts, productsPerPage, safeCurrentPage, sortBy]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (criteria: FilterCriteria) => {
    setFilters(criteria);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchQuery("");
    setCurrentPage(1);
    router.push("/products");
  };

  return (
    <PublicLayout
      banner={
        <Banner
          title={searchQuery ? `Results for "${searchQuery}"` : "All Products"}
        />
      }
      contentClassName="min-h-screen flex flex-col"
    >
      {/* Below-banner search — matches Figma Products Page design */}
      <div className="border-b border-[#E7EBF2] bg-[#F5F7FA] px-4 py-5 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <SearchAutocomplete
            key={searchParams.get("search") ?? ""}
            initialValue={searchParams.get("search") ?? ""}
            placeholder="What equipment are you looking for?"
            className="w-full"
          />
        </div>
      </div>

      <div className="flex-1 bg-white px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: horizontal chip filter bar */}
          <div className="sticky top-[80px] z-40 -mx-4 mb-4 block border-b border-[#E7EBF2] bg-white px-4 py-2 shadow-[0_6px_18px_rgba(15,37,79,0.06)] lg:hidden">
            <FilterChipBar
              counts={filterCounts}
              filters={filters}
              sortBy={sortBy}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-8 lg:h-fit">
              <FilterSidebar
                key={[
                  filters.category ?? "",
                  filters.oem ?? "",
                  filters.distributor ?? "",
                  filters.availability ?? "",
                  filters.minPrice ?? "",
                  filters.maxPrice ?? "",
                  filters.amount ?? "",
                ].join("|")}
                counts={filterCounts}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {isLoading ? (
              <BigLoader />
            ) : (
              <ProductGrid
                products={currentProducts}
                totalResults={filteredTotal}
                hasFetchError={isError}
                fetchErrorMessage={message}
                currentPage={safeCurrentPage}
                totalPages={computedTotalPages}
                onPageChange={(page) =>
                  setCurrentPage(Math.max(1, Math.min(page, computedTotalPages)))
                }
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProductPage;
