/**
 * Display formatting for `Product.countries`: stored values are ISO 3166-1 alpha-2 codes (e.g. NG).
 */

let regionNamesEn: Intl.DisplayNames | null | undefined;

function getEnglishRegionDisplayNames(): Intl.DisplayNames | null {
  if (regionNamesEn !== undefined) {
    return regionNamesEn;
  }
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    regionNamesEn = null;
    return null;
  }
  try {
    regionNamesEn = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNamesEn = null;
  }
  return regionNamesEn ?? null;
}

/**
 * Maps one stored country code to an English display name. Falls back to the trimmed input if lookup fails.
 * Canonical storage is ISO 3166-1 alpha-2; alpha-3 is still passed through `Intl` when present for legacy rows.
 */
export function countryCodeToDisplayLabel(value: string): string {
  const raw = value?.trim();
  if (!raw) {
    return "";
  }

  const upper = raw.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper) && !/^[A-Z]{3}$/.test(upper)) {
    return raw;
  }

  const display = getEnglishRegionDisplayNames();
  if (!display) {
    return upper;
  }

  const name = display.of(upper);
  if (name && name !== upper) {
    return name;
  }

  return raw;
}

/** Comma-separated English country names for API country code arrays. */
export function formatProductCountriesLabel(countries?: string[]): string {
  if (!countries?.length) {
    return "--";
  }

  return countries.map(countryCodeToDisplayLabel).filter(Boolean).join(", ");
}
