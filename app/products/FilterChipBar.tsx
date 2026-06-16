"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import type { FilterCriteria, FilterCounts } from "./FilterSidebar";

const DEFAULT_MIN_PRICE = 10000;
const DEFAULT_MAX_PRICE = 500000;

type ChipKey = "categories" | "oem" | "sortBy" | "distributors" | "availability" | "price";

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "price-asc", label: "Price: Low-High" },
  { value: "price-desc", label: "Price: High-Low" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

interface FilterChipBarProps {
  counts: FilterCounts;
  filters: FilterCriteria;
  sortBy: string;
  onFilterChange: (filters: FilterCriteria) => void;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

function RadioOption({
  label,
  count,
  checked,
  onClick,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 py-1 text-sm text-left ${checked ? "text-[#0669D9] font-medium" : "text-gray-700"}`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${checked ? "border-[#0669D9]" : "border-gray-400"}`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-[#0669D9]" />}
      </span>
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </button>
  );
}

export default function FilterChipBar({
  counts,
  filters,
  sortBy,
  onFilterChange,
  onSortChange,
  onClearFilters,
}: FilterChipBarProps) {
  const [openChip, setOpenChip] = useState<ChipKey | null>(null);
  const [priceMin, setPriceMin] = useState(filters.minPrice ?? DEFAULT_MIN_PRICE);
  const [priceMax, setPriceMax] = useState(filters.maxPrice ?? DEFAULT_MAX_PRICE);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenChip(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleChip = (chip: ChipKey) =>
    setOpenChip((prev) => (prev === chip ? null : chip));

  const isActive = (chip: ChipKey): boolean => {
    switch (chip) {
      case "categories": return !!filters.category;
      case "oem": return filters.oem === "oem";
      case "distributors": return filters.distributor === "distributor";
      case "availability": return !!filters.availability;
      case "price":
        return typeof filters.minPrice === "number" || typeof filters.maxPrice === "number";
      case "sortBy": return !!sortBy;
      default: return false;
    }
  };

  const anyActive =
    isActive("categories") ||
    isActive("oem") ||
    isActive("distributors") ||
    isActive("availability") ||
    isActive("price") ||
    isActive("sortBy");

  const chipClass = (chip: ChipKey) =>
    `flex shrink-0 items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer border transition-colors ${
      isActive(chip)
        ? "bg-blue-50 border-blue-300 text-[#0669D9]"
        : "bg-[rgba(107,114,128,0.06)] border-transparent text-gray-700"
    }`;

  const applyFilter = (partial: Partial<FilterCriteria>) => {
    onFilterChange({ ...filters, ...partial });
    setOpenChip(null);
  };

  const formatPrice = (price: number) => price.toLocaleString("de-DE");

  return (
    <div ref={containerRef} className="relative">
      {/* Horizontally scrollable chip row */}
      <div
        className="flex flex-row gap-2 py-2 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        <button type="button" className={chipClass("categories")} onClick={() => toggleChip("categories")}>
          Categories
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "categories" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" className={chipClass("oem")} onClick={() => toggleChip("oem")}>
          OEM
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "oem" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" className={chipClass("sortBy")} onClick={() => toggleChip("sortBy")}>
          Sort By
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "sortBy" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" className={chipClass("distributors")} onClick={() => toggleChip("distributors")}>
          Distributors
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "distributors" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" className={chipClass("availability")} onClick={() => toggleChip("availability")}>
          Availability
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "availability" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" className={chipClass("price")} onClick={() => toggleChip("price")}>
          Price
          <ChevronDown
            size={14}
            className={`transition-transform ${openChip === "price" ? "rotate-180" : ""}`}
          />
        </button>

        {anyActive && (
          <button
            type="button"
            onClick={() => { onClearFilters(); setOpenChip(null); }}
            className="flex shrink-0 items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200 whitespace-nowrap"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {openChip && (
        <div className="absolute left-0 top-full z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">
          {openChip === "categories" && (
            <div className="space-y-2">
              {[
                { value: null, label: "All categories", count: counts.categories.all },
                { value: "equipment", label: "Equipment", count: counts.categories.equipment },
                { value: "consumables", label: "Consumables", count: counts.categories.consumables },
                { value: "instruments", label: "Instruments", count: counts.categories.instruments },
                { value: "accessories", label: "Accessories", count: counts.categories.accessories },
                { value: "spare parts", label: "Spare Parts", count: counts.categories["spare parts"] },
              ].map(({ value, label, count }) => (
                <RadioOption
                  key={label}
                  label={label}
                  count={count}
                  checked={filters.category === value || (!filters.category && value === null)}
                  onClick={() => applyFilter({ category: value as string | null })}
                />
              ))}
            </div>
          )}

          {openChip === "oem" && (
            <RadioOption
              label="OEM"
              count={counts.oem.oem}
              checked={filters.oem === "oem"}
              onClick={() => applyFilter({ oem: filters.oem === "oem" ? null : "oem" })}
            />
          )}

          {openChip === "distributors" && (
            <RadioOption
              label="Distributor"
              count={counts.distributor.distributor}
              checked={filters.distributor === "distributor"}
              onClick={() =>
                applyFilter({
                  distributor: filters.distributor === "distributor" ? null : "distributor",
                })
              }
            />
          )}

          {openChip === "sortBy" && (
            <div className="space-y-1">
              {SORT_OPTIONS.map(({ value, label }) => (
                <RadioOption
                  key={value || "default"}
                  label={label}
                  checked={sortBy === value}
                  onClick={() => { onSortChange(value); setOpenChip(null); }}
                />
              ))}
            </div>
          )}

          {openChip === "availability" && (
            <div className="space-y-2">
              {[
                { value: null, label: "All Items", count: counts.availability.all },
                { value: "available", label: "Available", count: counts.availability.available },
                { value: "unavailable", label: "Unavailable", count: counts.availability.unavailable },
              ].map(({ value, label, count }) => (
                <RadioOption
                  key={label}
                  label={label}
                  count={count}
                  checked={filters.availability === value || (!filters.availability && value === null)}
                  onClick={() =>
                    applyFilter({ availability: value as "available" | "unavailable" | null })
                  }
                />
              ))}
            </div>
          )}

          {openChip === "price" && (
            <div className="space-y-3 w-52">
              <p className="text-sm text-gray-700 font-medium">
                ₦{formatPrice(priceMin)} - ₦{formatPrice(priceMax)}
              </p>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Min price</label>
                <input
                  type="range"
                  min={DEFAULT_MIN_PRICE}
                  max={DEFAULT_MAX_PRICE}
                  step={10000}
                  value={priceMin}
                  onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
                  className="w-full accent-[#0669D9]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Max price</label>
                <input
                  type="range"
                  min={DEFAULT_MIN_PRICE}
                  max={DEFAULT_MAX_PRICE}
                  step={10000}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
                  className="w-full accent-[#0669D9]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  onFilterChange({ ...filters, minPrice: priceMin, maxPrice: priceMax });
                  setOpenChip(null);
                }}
                className="w-full bg-[#0669D9] text-white rounded-lg py-2 text-sm font-medium"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
