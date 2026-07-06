"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { useProductsQuery } from "@/hooks/queries/products";
import { useUsersQuery } from "@/hooks/queries/users";
import type { Product, ProductImage } from "@/types/product";
import type { PublicProfileData } from "@/types/user";
import { UserRole } from "@/types/user";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const PRODUCT_PLACEHOLDER_IMG = "/images/product 2.webp";
const PROFILE_PLACEHOLDER_IMG = "/images/profile.webp";
const UNIVERSAL_GROUP_LIMIT = 3;
const PRODUCT_SCOPE_LIMIT = 6;

type SearchScope = "products" | "public-universal";
type SearchGroupKey = "products" | "distributors" | "oems" | "engineers";
type SearchResultKind = "product" | "distributor" | "oem" | "engineer";

interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  imageSrc: string;
  href: string;
  trailingText?: string;
}

interface SearchSection {
  key: SearchGroupKey;
  label: string;
  items: SearchResultItem[];
}

function getProductImageUrl(images?: ProductImage[]): string {
  const first = images?.[0];
  return first?.url || PRODUCT_PLACEHOLDER_IMG;
}

function getProfileImageUrl(profile: PublicProfileData): string {
  return profile.displayPhoto?.url || PROFILE_PLACEHOLDER_IMG;
}

function buildProductResult(product: Product): SearchResultItem {
  const trailingText =
    product.pricing_type === "rfq"
      ? "RFQ"
      : typeof product.pricePerUnit === "number" && Number.isFinite(product.pricePerUnit)
        ? new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(product.pricePerUnit)
        : undefined;

  return {
    id: product._id,
    kind: "product",
    title: product.name,
    subtitle: product.category,
    imageSrc: getProductImageUrl(product.images),
    href: `/products/${product._id}`,
    trailingText,
  };
}

function buildProfileResult(profile: PublicProfileData): SearchResultItem {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const subtitleByRole: Record<SearchResultKind, string> = {
    distributor: profile.address?.trim() || "Distributor",
    oem: profile.address?.trim() || "OEM",
    engineer: profile.address?.trim() || "Service Engineer",
    product: "",
  };

  const roleMap: Record<PublicProfileData["role"], SearchResultKind> = {
    [UserRole.DISTRIBUTOR]: "distributor",
    [UserRole.OEM]: "oem",
    [UserRole.ENGINEER]: "engineer",
  };

  const hrefMap: Record<SearchResultKind, string> = {
    distributor: `/distributor/profile?id=${profile._id}`,
    oem: `/distributor/oem-profile?id=${profile._id}`,
    engineer: `/service-engineers/profile?id=${profile._id}&view=profile`,
    product: `/products`,
  };

  const kind = roleMap[profile.role];

  return {
    id: profile._id,
    kind,
    title: fullName || "Public profile",
    subtitle: subtitleByRole[kind],
    imageSrc: getProfileImageUrl(profile),
    href: hrefMap[kind],
  };
}

export default function SearchAutocomplete({
  className,
  placeholder = "What equipment are you looking for?",
  initialValue = "",
  showSubmitButton = true,
  scope = "products",
  onResultNavigate,
}: {
  className?: string;
  placeholder?: string;
  initialValue?: string;
  showSubmitButton?: boolean;
  scope?: SearchScope;
  onResultNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardSelectedRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  const scopeIsUniversal = scope === "public-universal";
  const trimmed = query.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;

  const searchEnabled = debouncedTerm.length >= MIN_QUERY_LENGTH;

  // Reads are keyed on the debounced term; React Query dedupes and cancels
  // stale requests when the term changes, so no manual request-id tracking.
  const productsQuery = useProductsQuery(
    scopeIsUniversal
      ? { search: debouncedTerm, status: "approved", limit: UNIVERSAL_GROUP_LIMIT }
      : { search: debouncedTerm, limit: PRODUCT_SCOPE_LIMIT },
    { enabled: searchEnabled },
  );
  const distributorsQuery = useUsersQuery(
    { page: 1, limit: UNIVERSAL_GROUP_LIMIT, roles: [UserRole.DISTRIBUTOR], search: debouncedTerm },
    { enabled: searchEnabled && scopeIsUniversal },
  );
  const oemsQuery = useUsersQuery(
    { page: 1, limit: UNIVERSAL_GROUP_LIMIT, roles: [UserRole.OEM], search: debouncedTerm },
    { enabled: searchEnabled && scopeIsUniversal },
  );
  const engineersQuery = useUsersQuery(
    { page: 1, limit: UNIVERSAL_GROUP_LIMIT, roles: [UserRole.ENGINEER], search: debouncedTerm },
    { enabled: searchEnabled && scopeIsUniversal },
  );

  const productSuggestions: Product[] = productsQuery.data?.products ?? [];
  const profileSuggestions = useMemo(
    () => ({
      distributors: distributorsQuery.data?.profiles ?? [],
      oems: oemsQuery.data?.profiles ?? [],
      engineers: engineersQuery.data?.profiles ?? [],
    }),
    [distributorsQuery.data, oemsQuery.data, engineersQuery.data],
  );

  const failedGroups = useMemo<SearchGroupKey[]>(() => {
    const groups: SearchGroupKey[] = [];
    if (productsQuery.isError) groups.push("products");
    if (scopeIsUniversal) {
      if (distributorsQuery.isError) groups.push("distributors");
      if (oemsQuery.isError) groups.push("oems");
      if (engineersQuery.isError) groups.push("engineers");
    }
    return groups;
  }, [
    productsQuery.isError,
    distributorsQuery.isError,
    oemsQuery.isError,
    engineersQuery.isError,
    scopeIsUniversal,
  ]);

  const isLoading = scopeIsUniversal
    ? productsQuery.isFetching ||
      distributorsQuery.isFetching ||
      oemsQuery.isFetching ||
      engineersQuery.isFetching
    : productsQuery.isFetching;

  // A settled fetch exists for the current term once the queries stop fetching.
  const hasFetched = searchEnabled && debouncedTerm === trimmed && !isLoading;

  const universalSections = useMemo<SearchSection[]>(() => {
    if (!scopeIsUniversal) return [];

    const sections: SearchSection[] = [
      {
        key: "products",
        label: "Products",
        items: productSuggestions.map(buildProductResult),
      },
      {
        key: "distributors",
        label: "Distributors",
        items: profileSuggestions.distributors.map(buildProfileResult),
      },
      {
        key: "oems",
        label: "OEMs",
        items: profileSuggestions.oems.map(buildProfileResult),
      },
      {
        key: "engineers",
        label: "Service Engineers",
        items: profileSuggestions.engineers.map(buildProfileResult),
      },
    ];

    return sections.filter((section) => section.items.length > 0);
  }, [productSuggestions, profileSuggestions, scopeIsUniversal]);

  const productScopeItems = useMemo<SearchResultItem[]>(
    () => productSuggestions.map(buildProductResult),
    [productSuggestions],
  );

  const flatResults = useMemo(
    () =>
      scopeIsUniversal
        ? universalSections.flatMap((section) => section.items)
        : productScopeItems,
    [productScopeItems, scopeIsUniversal, universalSections],
  );

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setIsOpen(false);
      setDebouncedTerm("");
      setActiveIndex(-1);
      keyboardSelectedRef.current = false;
      return;
    }

    setActiveIndex(-1);
    keyboardSelectedRef.current = false;

    const timer = window.setTimeout(() => {
      setDebouncedTerm(trimmed);
      setIsOpen(true);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchAction = useCallback(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setIsOpen(true);
      return;
    }

    setDebouncedTerm(trimmed);
    setIsOpen(true);
  }, [trimmed]);

  const navigateToSearch = useCallback(() => {
    const nextQuery = query.trim();
    if (nextQuery.length < MIN_QUERY_LENGTH) return;
    setIsOpen(false);
    onResultNavigate?.();
    router.push(`/products?search=${encodeURIComponent(nextQuery)}`);
  }, [onResultNavigate, query, router]);

  const navigateToResult = useCallback(
    (result: SearchResultItem) => {
      setIsOpen(false);
      setQuery("");
      onResultNavigate?.();
      router.push(result.href);
    },
    [onResultNavigate, router],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      keyboardSelectedRef.current = false;
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        keyboardSelectedRef.current &&
        activeIndex >= 0 &&
        activeIndex < flatResults.length
      ) {
        navigateToResult(flatResults[activeIndex]);
        return;
      }

      if (scopeIsUniversal) {
        handleSearchAction();
        return;
      }

      navigateToSearch();
      return;
    }

    if (!isOpen || flatResults.length === 0) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        keyboardSelectedRef.current = true;
        setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        keyboardSelectedRef.current = true;
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
    }
  }

  const universalAllFailed =
    scopeIsUniversal &&
    hasFetched &&
    failedGroups.length > 0 &&
    universalSections.length === 0;

  const productFetchFailed =
    !scopeIsUniversal &&
    hasFetched &&
    failedGroups.includes("products") &&
    productScopeItems.length === 0;

  let flatIndex = -1;

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? "w-full sm:w-[350px] md:w-[450px] lg:w-[500px]"}`}
    >
      <div className={`flex items-center ${showSubmitButton ? "gap-3 sm:gap-4" : ""}`}>
        <div className="relative flex-1">
          {!showSubmitButton && (
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa8bc]"
            />
          )}

          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
              keyboardSelectedRef.current = false;
            }}
            onFocus={() => {
              if (trimmed.length >= MIN_QUERY_LENGTH && debouncedTerm === trimmed) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`block w-full rounded-xl border bg-white text-gray1 placeholder-gray4 focus:border-gray2 focus:outline-none sm:text-sm ${
              showSubmitButton
                ? "border-gray5 px-4 py-3"
                : "border-[#e5ebf5] py-2.5 pl-10 pr-4 text-[0.82rem]"
            }`}
            autoComplete="off"
          />

          {isLoading && (
            <Loader2
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            />
          )}
        </div>

        {showSubmitButton && (
          <button
            onClick={scopeIsUniversal ? handleSearchAction : navigateToSearch}
            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-[#E3F7FF] px-5 py-3 text-sm font-medium text-[#0E387A] transition-colors hover:bg-[#cceeff]"
          >
            <Search size={16} />
            Search
          </button>
        )}
      </div>

      {isTooShort && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
          Type at least {MIN_QUERY_LENGTH} characters
        </div>
      )}

      {isOpen && !isTooShort && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {isLoading && !hasFetched ? (
            <div className="px-4 py-4 text-center text-sm text-gray-500">Searching...</div>
          ) : productFetchFailed ? (
            <div className="px-4 py-4 text-center text-sm text-red-500">
              Search is unavailable right now. Please try again.
            </div>
          ) : universalAllFailed ? (
            <div className="px-4 py-4 text-center text-sm text-red-500">
              Search is unavailable right now. Please try again.
            </div>
          ) : scopeIsUniversal ? (
            universalSections.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-gray-500">
                No results found for &ldquo;{trimmed}&rdquo;
              </div>
            ) : (
              <>
                {universalSections.map((section) => (
                  <div key={section.key} className="border-b border-gray-100 last:border-b-0">
                    <div className="bg-[#f8fafc] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a889c]">
                      {section.label}
                    </div>
                    <ul>
                      {section.items.map((item) => {
                        flatIndex += 1;
                        const currentFlatIndex = flatIndex;
                        return (
                          <li
                            key={`${section.key}-${item.id}`}
                            onMouseEnter={() => {
                              keyboardSelectedRef.current = false;
                              setActiveIndex(currentFlatIndex);
                            }}
                            onClick={() => navigateToResult(item)}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                              currentFlatIndex === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <Image
                              src={item.imageSrc}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="h-10 w-10 shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {failedGroups.length > 0 && (
                  <div className="px-4 py-3 text-center text-xs text-gray-500">
                    Some results are unavailable right now.
                  </div>
                )}
              </>
            )
          ) : productScopeItems.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-gray-500">
              No products found for &ldquo;{trimmed}&rdquo;
            </div>
          ) : (
            <>
              <ul className="max-h-[360px] overflow-y-auto">
                {productScopeItems.map((item, index) => (
                  <li
                    key={item.id}
                    onMouseEnter={() => {
                      keyboardSelectedRef.current = false;
                      setActiveIndex(index);
                    }}
                    onClick={() => navigateToResult(item)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                      index === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                    </div>
                    {item.trailingText && (
                      <span className="shrink-0 text-sm font-semibold text-[#FE6E00]">
                        {item.trailingText}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div
                onClick={navigateToSearch}
                className="cursor-pointer border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-[#0669D9] hover:bg-blue-50"
              >
                View all results for &ldquo;{trimmed}&rdquo;
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
