"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+30", flag: "🇬🇷", name: "Greece" },
  { code: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "+420", flag: "🇨🇿", name: "Czech Republic" },
  { code: "+36", flag: "🇭🇺", name: "Hungary" },
  { code: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+855", flag: "🇰🇭", name: "Cambodia" },
  { code: "+856", flag: "🇱🇦", name: "Laos" },
  { code: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+98", flag: "🇮🇷", name: "Iran" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "+237", flag: "🇨🇲", name: "Cameroon" },
  { code: "+225", flag: "🇨🇮", name: "Ivory Coast" },
  { code: "+221", flag: "🇸🇳", name: "Senegal" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+51", flag: "🇵🇪", name: "Peru" },
  { code: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
];

type Country = (typeof COUNTRY_CODES)[number];

const DEFAULT_COUNTRY = COUNTRY_CODES.find((c) => c.code === "+234" && c.name === "Nigeria")!;

interface PhoneInputProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  label = "Phone number",
  value = "",
  onChange,
  error,
  disabled,
}) => {
  const [selected, setSelected] = useState<Country>(() => {
    if (value) {
      const match = [...COUNTRY_CODES]
        .sort((a, b) => b.code.length - a.code.length)
        .find((c) => value.startsWith(c.code));
      return match ?? DEFAULT_COUNTRY;
    }
    return DEFAULT_COUNTRY;
  });

  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (value && value.startsWith(selected.code)) {
      return value.slice(selected.code.length);
    }
    return "";
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search),
      )
    : COUNTRY_CODES;

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCountry = (country: Country) => {
    setSelected(country);
    setOpen(false);
    const combined = `${country.code}${localNumber}`;
    onChange?.(combined);
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setLocalNumber(digits);
    onChange?.(`${selected.code}${digits}`);
  };

  const hasError = !!error;

  return (
    <div className="flex w-full flex-col gap-[var(--control-label-gap)]" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="type-label font-medium text-gray2">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex h-[var(--control-height-lg)] w-full overflow-hidden rounded-lg border bg-white transition-[border-color]",
          hasError ? "border-danger" : "border-gray5 focus-within:border-ring",
          disabled && "cursor-not-allowed bg-gray7",
        )}
      >
        {/* Country selector trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r border-gray5 pl-3 pr-2.5 text-sm font-medium text-gray1 transition-colors hover:bg-gray7",
            disabled && "cursor-not-allowed",
          )}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="whitespace-nowrap">{selected.code}</span>
          <ChevronDown
            className={cn(
              "size-3.5 text-gray3 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {/* Phone number input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localNumber}
          onChange={handleLocalNumberChange}
          disabled={disabled}
          placeholder="Enter phone number"
          className={cn(
            "type-title-md h-full w-full bg-transparent px-3 text-gray1 placeholder:text-gray4 outline-none",
            disabled && "cursor-not-allowed text-gray3",
          )}
        />
      </div>

      {/* Searchable dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 w-full rounded-lg border border-gray5 bg-white shadow-lg">
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-gray5 px-3 py-2">
              <Search className="size-4 shrink-0 text-gray4" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                className="type-title-md w-full bg-transparent text-gray1 placeholder:text-gray4 outline-none"
              />
            </div>

            {/* Results list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray4">No results</li>
              ) : (
                filtered.map((country, i) => (
                  <li key={`${country.code}-${country.name}-${i}`}>
                    <button
                      type="button"
                      onClick={() => selectCountry(country)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray1 hover:bg-gray7",
                        selected.code === country.code &&
                          selected.name === country.name &&
                          "bg-primary-light font-medium",
                      )}
                    >
                      <span className="text-base">{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      <span className="text-gray3">{country.code}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};
