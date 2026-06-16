"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@/components/base";

const DEFAULT_MIN_PRICE = 10000;
const DEFAULT_MAX_PRICE = 500000;

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 mb-3"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`text-gray-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
}

interface FilterOptionProps {
  label: string;
  checked: boolean;
  count?: number;
  onToggle: () => void;
}

function FilterOption({
  label,
  checked,
  count,
  onToggle,
}: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 text-left text-sm text-gray-700"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-[#0669D9]" : "border-gray-400"
        }`}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-[#0669D9]" /> : null}
      </span>
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="text-xs text-gray-400">({count})</span>
      ) : null}
    </button>
  );
}

export interface FilterCriteria {
  category: string | null;
  oem?: "oem" | null;
  distributor?: "distributor" | null;
  minPrice?: number;
  maxPrice?: number;
  amount?: number;
  availability?: "available" | "unavailable" | null;
}

export interface FilterCounts {
  categories: Record<string, number>;
  oem: {
    all: number;
    oem: number;
  };
  distributor: {
    all: number;
    distributor: number;
  };
  availability: {
    all: number;
    available: number;
    unavailable: number;
  };
}

interface FilterSidebarProps {
  counts: FilterCounts;
  filters: FilterCriteria;
  onFilterChange?: (filters: FilterCriteria) => void;
  onClearFilters?: () => void;
}

export default function FilterSidebar({
  counts,
  filters,
  onFilterChange,
  onClearFilters,
}: FilterSidebarProps) {
  const [draftFilters, setDraftFilters] = useState<FilterCriteria>(filters);
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? DEFAULT_MAX_PRICE);
  const [amountInput, setAmountInput] = useState(
    typeof filters.amount === "number" ? String(filters.amount) : ""
  );
  const [priceTouched, setPriceTouched] = useState(
    typeof filters.minPrice === "number" ||
      typeof filters.maxPrice === "number" ||
      typeof filters.amount === "number"
  );

  const formatPrice = (price: number): string => {
    return price.toLocaleString("de-DE");
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPriceTouched(true);
    setMinPrice(Math.min(value, maxPrice));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setPriceTouched(true);
    setMaxPrice(Math.max(value, minPrice));
  };

  const toggleFilterValue = <
    K extends "category" | "oem" | "distributor" | "availability"
  >(
    key: K,
    value: NonNullable<FilterCriteria[K]>
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: current[key] === value ? null : value,
    }));
  };

  const clearFilterValue = (
    key: "category" | "oem" | "distributor" | "availability"
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: null,
    }));
  };

  const handleApplyFilter = () => {
    const nextFilters: FilterCriteria = {
      ...draftFilters,
      minPrice: priceTouched ? minPrice : undefined,
      maxPrice: priceTouched ? maxPrice : undefined,
      amount: undefined,
    };

    if (amountInput.trim()) {
      const amount = parseInt(amountInput.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(amount) && amount > 0) {
        nextFilters.amount = amount;
      }
    }

    onFilterChange?.(nextFilters);
  };

  const handleClearFilters = () => {
    setDraftFilters({
      category: null,
      oem: null,
      distributor: null,
      minPrice: undefined,
      maxPrice: undefined,
      amount: undefined,
      availability: null,
    });
    setMinPrice(DEFAULT_MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setAmountInput("");
    setPriceTouched(false);

    onClearFilters?.();
  };

  return (
    <div className="w-full md:w-64 lg:w-72 rounded-lg overflow-hidden">
      <div className="p-4 pb-3 items-start w-2/4">
        <Button
          title="Filter"
          variant="primaryLight"
          size="sm"
          iconRight={<SlidersHorizontal size={16} className="text-gray-800" />}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none bg-[#E3F7FF]! hover:bg-[#CBE5FF]! text-gray-800! border-none! shadow-none! justify-between! w-full"
        />
      </div>
      <div className="bg-white rounded-lg py-3 border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 pt-0">
          <FilterSection title="Categories">
            <FilterOption
              label="All categories"
              count={counts.categories.all}
              checked={!draftFilters.category}
              onToggle={() => clearFilterValue("category")}
            />
            <FilterOption
              label="Equipment"
              count={counts.categories.equipment}
              checked={draftFilters.category === "equipment"}
              onToggle={() => toggleFilterValue("category", "equipment")}
            />
            <FilterOption
              label="Consumables"
              count={counts.categories.consumables}
              checked={draftFilters.category === "consumables"}
              onToggle={() => toggleFilterValue("category", "consumables")}
            />
            <FilterOption
              label="Instruments"
              count={counts.categories.instruments}
              checked={draftFilters.category === "instruments"}
              onToggle={() => toggleFilterValue("category", "instruments")}
            />
            <FilterOption
              label="Accessories"
              count={counts.categories.accessories}
              checked={draftFilters.category === "accessories"}
              onToggle={() => toggleFilterValue("category", "accessories")}
            />
            <FilterOption
              label="Spare Parts"
              count={counts.categories["spare parts"]}
              checked={draftFilters.category === "spare parts"}
              onToggle={() => toggleFilterValue("category", "spare parts")}
            />
          </FilterSection>

          <FilterSection title="OEM">
            <FilterOption
              label="OEM"
              count={counts.oem.oem}
              checked={draftFilters.oem === "oem"}
              onToggle={() => toggleFilterValue("oem", "oem")}
            />
          </FilterSection>

          <FilterSection title="Distributors">
            <FilterOption
              label="Distributor"
              count={counts.distributor.distributor}
              checked={draftFilters.distributor === "distributor"}
              onToggle={() => toggleFilterValue("distributor", "distributor")}
            />
          </FilterSection>

          <FilterSection title="Price">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Price: ₦{formatPrice(minPrice)} - ₦{formatPrice(maxPrice)}
              </p>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray2">
                  Minimum price
                  <input
                    type="range"
                    min={String(DEFAULT_MIN_PRICE)}
                    max={String(DEFAULT_MAX_PRICE)}
                    step="10000"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="mt-2 h-2 w-full accent-[#0669D9]"
                  />
                </label>

                <label className="block text-xs font-medium text-gray2">
                  Maximum price
                  <input
                    type="range"
                    min={String(DEFAULT_MIN_PRICE)}
                    max={String(DEFAULT_MAX_PRICE)}
                    step="10000"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="mt-2 h-2 w-full accent-[#0669D9]"
                  />
                </label>
              </div>

              <div className="pt-1">
                <Input
                  id="amount-input"
                  type="text"
                  label="Amount"
                  placeholder="Enter preferred amount"
                  value={amountInput}
                  onValueChange={(val) => {
                    setPriceTouched(true);
                    setAmountInput(val);
                  }}
                  className="[&>label]:text-xs [&>label]:text-gray-700 [&>label]:mb-1.5 [&>label]:font-medium border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:ring-[#0669D9] focus:border-[#0669D9]"
                />
              </div>
            </div>
          </FilterSection>

          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Button
                title="Filter"
                variant="primary"
                size="sm"
                iconLeft={<SlidersHorizontal size={16} />}
                onClick={handleApplyFilter}
                className="w-full!"
              />
            </div>
            <Button
              title="Clear"
              variant="secondaryLight"
              size="sm"
              onClick={handleClearFilters}
              className="w-auto!"
            />
          </div>

          <FilterSection title="Availability">
            <FilterOption
              label="All Items"
              count={counts.availability.all}
              checked={!draftFilters.availability}
              onToggle={() => clearFilterValue("availability")}
            />
            <FilterOption
              label="Only Items Available"
              count={counts.availability.available}
              checked={draftFilters.availability === "available"}
              onToggle={() => toggleFilterValue("availability", "available")}
            />
            <FilterOption
              label="Only Items Not Available"
              count={counts.availability.unavailable}
              checked={draftFilters.availability === "unavailable"}
              onToggle={() => toggleFilterValue("availability", "unavailable")}
            />
          </FilterSection>
        </div>
      </div>
    </div>
  );
}
