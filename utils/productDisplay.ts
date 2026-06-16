import type {
  KeyAttributeItem,
  KeyAttributes,
  Product,
  ProductImage,
} from "@/types/product";
import { countryCodeToDisplayLabel } from "@/utils/countryDisplay";

export type ProductSpecItem = {
  label: string;
  value: string;
  group: "industry_specific" | "other" | "legacy";
};

/** Used when a product has no usable image URLs. */
/** Used when a product has no usable image URLs. */
export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product 2.webp";

const normalizeText = (value?: string | null): string => value?.trim() ?? "";
const isNonNullProductSpecItem = (
  item: ProductSpecItem | null,
): item is ProductSpecItem => item !== null;

const normalizeLegacySpecificationText = (value: string): string =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/<\s*br\s*\/?>/gi, ";")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, ";")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

const formatSentenceCase = (value: string): string =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const buildSpecItem = (
  item: KeyAttributeItem,
  group: ProductSpecItem["group"],
): ProductSpecItem | null => {
  const label = normalizeText(item.spec ?? item.label);
  const value = normalizeText(item.detail ?? item.value);

  if (!label && !value) {
    return null;
  }

  return {
    label: label || "Specification",
    value,
    group,
  };
};

const extractSpecItemsFromAttributes = (
  attributes?: KeyAttributes,
): ProductSpecItem[] => {
  if (!attributes) {
    return [];
  }

  const industrySpecific = (attributes.industry_specific ?? [])
    .map((item) => buildSpecItem(item, "industry_specific"))
    .filter(isNonNullProductSpecItem);
  const other = (attributes.other ?? [])
    .map((item) => buildSpecItem(item, "other"))
    .filter(isNonNullProductSpecItem);

  return [...industrySpecific, ...other];
};

const extractSpecItemsFromLegacyString = (
  keySpecifications?: string,
): ProductSpecItem[] => {
  const normalized = normalizeText(keySpecifications);
  if (!normalized) {
    return [];
  }

  return normalizeLegacySpecificationText(normalized)
    .split(/[;\n]+/)
    .map<ProductSpecItem | null>((entry) => {
      const trimmedEntry = normalizeText(entry);
      if (!trimmedEntry) {
        return null;
      }

      const [rawLabel, ...rawValueParts] = trimmedEntry.split(":");
      const label = normalizeText(rawLabel) || "Specification";
      const value = normalizeText(rawValueParts.join(":"));

      return {
        label,
        value,
        group: "legacy" as const,
      };
    })
    .filter(isNonNullProductSpecItem);
};

export const getProductSpecificationItems = (
  product?: Pick<Product, "key_attributes" | "keySpecifications"> | null,
): ProductSpecItem[] => {
  const attributeItems = extractSpecItemsFromAttributes(product?.key_attributes);
  if (attributeItems.length > 0) {
    return attributeItems;
  }

  return extractSpecItemsFromLegacyString(product?.keySpecifications);
};

export const getProductDefaultImageUrl = (
  product?: Pick<Product, "images"> | null,
  fallback = PRODUCT_IMAGE_PLACEHOLDER,
): string => {
  if (!product?.images?.length) {
    return fallback;
  }

  const defaultImageRaw =
    product.images.find((image) => image.isDefault)?.url ??
    product.images[0]?.url;
  const defaultImage =
    typeof defaultImageRaw === "string" ? defaultImageRaw.trim() : "";

  return defaultImage || fallback;
};

export const getProductImageUrls = (
  product?: Pick<Product, "images"> | null,
): string[] =>
  product?.images
    ?.map((image: ProductImage) => image.url?.trim())
    .filter((url): url is string => Boolean(url)) ?? [];

export const getProductAvailabilityLabel = (
  product?: Pick<Product, "quantityAvailable" | "availability_status"> | null,
): string => {
  const quantity = product?.quantityAvailable;
  if (typeof quantity === "number") {
    if (quantity > 0) {
      return `${quantity} In stock`;
    }

    return "Out of stock";
  }

  if (product?.availability_status) {
    return formatSentenceCase(product.availability_status);
  }

  return "Availability not specified";
};

export const isProductAvailable = (
  product?: Pick<Product, "quantityAvailable" | "availability_status"> | null,
): boolean => {
  if (typeof product?.quantityAvailable === "number") {
    return product.quantityAvailable > 0;
  }

  return product?.availability_status === "in_stock";
};

export const getProductStockTableValue = (
  product?: Pick<Product, "quantityAvailable" | "availability_status"> | null,
): string => {
  if (typeof product?.quantityAvailable === "number") {
    return String(product.quantityAvailable);
  }

  if (product?.availability_status) {
    return formatSentenceCase(product.availability_status);
  }

  return "--";
};

export const getPrimaryProductLocation = (
  product?: Pick<Product, "countries" | "manufacturing_country"> | null,
): string | null => {
  const firstDeliveryCode = normalizeText(product?.countries?.[0]);
  if (firstDeliveryCode) {
    const label = countryCodeToDisplayLabel(firstDeliveryCode);
    return label || null;
  }

  const manufacturingCountry = normalizeText(product?.manufacturing_country);
  if (!manufacturingCountry) {
    return null;
  }

  return manufacturingCountry.toUpperCase() === "NG"
    ? "Nigeria"
    : manufacturingCountry;
};

const compactAddressForListing = (address?: string | null): string => {
  const parts = normalizeText(address)
    .split(",")
    .map((part) => normalizeText(part))
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.slice(-2).join(" ");
};

export const getProductListingLocation = (
  product?: Pick<Product, "countries" | "manufacturing_country" | "createdBy"> | null,
): string | null => {
  const country = getPrimaryProductLocation(product);
  const sellerAddress =
    product?.createdBy && typeof product.createdBy === "object"
      ? compactAddressForListing(product.createdBy.address)
      : "";

  if (sellerAddress && country) {
    return sellerAddress.toLowerCase().includes(country.toLowerCase())
      ? sellerAddress
      : `${sellerAddress} ${country}`;
  }

  return sellerAddress || country;
};

export const getPricingModeLabel = (
  product?: Pick<Product, "priceMode" | "pricing_type"> | null,
): string => {
  const rawValue = product?.pricing_type ?? product?.priceMode;
  if (!rawValue) {
    return "Not specified";
  }

  return formatSentenceCase(rawValue);
};
