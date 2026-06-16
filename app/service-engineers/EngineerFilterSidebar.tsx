"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import type { PublicProfileFacetItem } from "@/types/user";

export interface EngineerFilters {
  location: string;
  specialization: string;
  equipmentType: string;
  minimumRating: string;
  availability: string;
}

const EMPTY_FILTERS: EngineerFilters = {
  location: "",
  specialization: "",
  equipmentType: "",
  minimumRating: "",
  availability: "",
};

type RadioOption = {
  label: string;
  value: string;
  filteredCount?: number;
};

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#eef3f8] pb-5 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-[15px] font-semibold text-[#163052]"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`text-[#7e8ca3] transition-transform ${isOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

function RadioGroup({
  name,
  allLabel,
  value,
  onChange,
  options,
}: {
  name: string;
  allLabel: string;
  value: string;
  onChange: (v: string) => void;
  options: RadioOption[];
}) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="radio"
          name={name}
          checked={value === ""}
          onChange={() => onChange("")}
          className="h-3.5 w-3.5 accent-[#0669d9]"
        />
        <span className="text-[13px] text-[#5e6c82]">{allLabel}</span>
      </label>

      {options.map((option) => {
        const disabled = option.filteredCount === 0;
        const label =
          typeof option.filteredCount === "number"
            ? `${option.label} (${option.filteredCount})`
            : option.label;

        return (
          <label
            key={option.value}
            className={`flex items-center gap-2.5 ${
              disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="h-3.5 w-3.5 accent-[#0669d9]"
            />
            <span className="text-[13px] text-[#5e6c82]">{label}</span>
          </label>
        );
      })}
    </div>
  );
}

interface EngineerFilterSidebarProps {
  locations: PublicProfileFacetItem[];
  specializations: PublicProfileFacetItem[];
  equipmentTypes: PublicProfileFacetItem[];
  onFilterChange: (filters: EngineerFilters) => void;
  onClearFilters: () => void;
}

export default function EngineerFilterSidebar({
  locations,
  specializations,
  equipmentTypes,
  onFilterChange,
  onClearFilters,
}: EngineerFilterSidebarProps) {
  const [draft, setDraft] = useState<EngineerFilters>(EMPTY_FILTERS);

  const set = <K extends keyof EngineerFilters>(key: K, value: EngineerFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    onClearFilters();
  };

  return (
    <div className="w-full max-w-[250px] shrink-0">
      <div className="rounded-[24px] border border-[#edf2f8] bg-white p-5 shadow-[0_10px_30px_rgba(15,37,79,0.04)]">
        <div className="space-y-5">
          <FilterSection title="Location">
            <RadioGroup
              name="location"
              allLabel="All locations"
              value={draft.location}
              onChange={(value) => set("location", value)}
              options={locations.map((location) => ({
                label: location.value,
                value: location.value,
                filteredCount: location.filteredCount,
              }))}
            />
          </FilterSection>

          <FilterSection title="Specialization">
            <RadioGroup
              name="specialization"
              allLabel="All specialization"
              value={draft.specialization}
              onChange={(value) => set("specialization", value)}
              options={specializations.map((specialization) => ({
                label: specialization.value,
                value: specialization.value,
                filteredCount: specialization.filteredCount,
              }))}
            />
          </FilterSection>

          <FilterSection title="Equipment Type">
            <RadioGroup
              name="equipmentType"
              allLabel="All equipment"
              value={draft.equipmentType}
              onChange={(value) => set("equipmentType", value)}
              options={equipmentTypes.map((equipmentType) => ({
                label: equipmentType.value,
                value: equipmentType.value,
                filteredCount: equipmentType.filteredCount,
              }))}
            />
          </FilterSection>

          <FilterSection title="Availability">
            <RadioGroup
              name="availability"
              allLabel="All availability"
              value={draft.availability}
              onChange={(value) => set("availability", value)}
              options={[
                { label: "Available", value: "available" },
                { label: "Busy", value: "busy" },
              ]}
            />
          </FilterSection>

          <FilterSection title="Minimum Rating">
            <RadioGroup
              name="minimumRating"
              allLabel="All ratings"
              value={draft.minimumRating}
              onChange={(value) => set("minimumRating", value)}
              options={[
                { label: "4+ stars", value: "4" },
                { label: "3+ stars", value: "3" },
                { label: "2+ stars", value: "2" },
                { label: "1+ stars", value: "1" },
              ]}
            />
          </FilterSection>
        </div>

        <button
          type="button"
          onClick={() => onFilterChange(draft)}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0669d9] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0459b9]"
        >
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="mt-3 w-full text-center text-[13px] font-medium text-[#627186] transition-colors hover:text-[#0669d9]"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
