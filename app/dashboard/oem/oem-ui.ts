import type { Product, ProductImage } from "@/types/product";
import type { UserData } from "@/types/user";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { formatProductCountriesLabel } from "@/utils/countryDisplay";

export type OemListingStatus = "pending" | "approved" | "rejected";

export interface OemDistributorSummary {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  totalRequests: number;
  verificationStatus: "verified" | "pending";
  verificationDateLabel: string;
  latestRequestAt: string | null;
  countries: string[];
}

const FALLBACK_AVATAR = DEFAULT_AVATAR_SRC;

export const normalizeOemStatus = (
  status: Product["oemApprovalStatus"],
): OemListingStatus => {
  if (status === "approved" || status === "rejected") {
    return status;
  }

  return "pending";
};

export const getOemStatusMeta = (status: OemListingStatus) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        className: "text-green-600",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "text-red-600",
      };
    default:
      return {
        label: "Pending",
        className: "text-[#FFC000]",
      };
  }
};

export const getDistributorVerificationMeta = (
  status: OemDistributorSummary["verificationStatus"],
) => {
  switch (status) {
    case "verified":
      return {
        label: "Verified",
        className: "text-[#2BA84A]",
        containerClassName: "border border-[#7FE7A2] bg-[#E7FFEF]",
        chipClassName: "bg-[#16A34A] text-white",
      };
    default:
      return {
        label: "Pending",
        className: "text-[#F59E0B]",
        containerClassName: "border border-[#FFD899] bg-[#FFF7E8]",
        chipClassName: "bg-[#FF8A00] text-white",
      };
  }
};

export const formatCurrency = (amount: number | undefined): string => {
  const value = Number.isFinite(amount) ? Number(amount) : 0;

  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatCompactDateTime = (value?: string | null): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} - ${timePart.toLowerCase()}`;
};

export const formatMonthDayYear = (value?: string | null): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const resolveDistributorVerificationAnchor = (product: Product): string | null =>
  product.updatedAt ?? product.submittedAt ?? product.createdAt ?? null;

const hasVerifiedDistributorPlaceholder = (product: Product): boolean =>
  product.oemApprovalStatus === "approved" || product.status === "approved";

export const buildDistributorVerificationSnapshot = (products: Product[]) => {
  const verifiedAnchors = products
    .filter(hasVerifiedDistributorPlaceholder)
    .map(resolveDistributorVerificationAnchor)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  if (verifiedAnchors.length > 0) {
    const formattedVerificationDate = formatCompactDateTime(verifiedAnchors[0]);

    return {
      verificationStatus: "verified" as const,
      verificationDateLabel:
        formattedVerificationDate === "--" ? "Recently verified" : formattedVerificationDate,
    };
  }

  return {
    verificationStatus: "pending" as const,
    verificationDateLabel: "Pending review",
  };
};

export const getDistributorName = (
  user: Product["createdBy"] | Product["assignedOem"] | UserData | null | undefined,
): string => {
  if (!user) {
    return "The name of the distributor";
  }

  if (typeof user === "string") {
    return user;
  }

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return name || "The name of the distributor";
};

export const getDistributorEmail = (user: Product["createdBy"] | UserData | null | undefined) => {
  if (!user || typeof user === "string") {
    return "Not publicly listed";
  }

  return user.email || "Not publicly listed";
};

export const getDistributorPhone = (user: Product["createdBy"] | UserData | null | undefined) => {
  if (!user || typeof user === "string") {
    return "Not publicly listed";
  }

  return user.phoneNumber || "Not publicly listed";
};

export const getDistributorAvatar = (
  user: Product["createdBy"] | UserData | null | undefined,
): string => {
  if (!user || typeof user === "string") {
    return FALLBACK_AVATAR;
  }

  return user.displayPhoto?.url || FALLBACK_AVATAR;
};

export const getProductHeroImage = (product: Product | null | undefined): ProductImage | null => {
  if (!product?.images?.length) {
    return null;
  }

  return product.images.find((image) => image.isDefault) || product.images[0];
};

export const buildCategoryBreakdown = (products: Product[]) => {
  const summary = products.reduce(
    (accumulator, product) => {
      const category = product.category?.toLowerCase();

      if (category.includes("consumable")) {
        accumulator.consumables += 1;
      } else {
        accumulator.equipment += 1;
      }

      return accumulator;
    },
    { equipment: 0, consumables: 0 },
  );

  return [
    { label: "Equipment", value: summary.equipment },
    { label: "Consumables", value: summary.consumables },
  ];
};

export const buildDistributorSummaries = (products: Product[]): OemDistributorSummary[] => {
  const grouped = new Map<
    string,
    Omit<OemDistributorSummary, "verificationStatus" | "verificationDateLabel"> & {
      products: Product[];
    }
  >();

  for (const product of products) {
    const createdBy = product.createdBy;
    const id = typeof createdBy === "string" ? createdBy : createdBy?._id;

    if (!id) {
      continue;
    }

    const current = grouped.get(id);
    const submittedAt = product.submittedAt ?? product.createdAt;
    const countries = product.countries ?? [];

    if (!current) {
      grouped.set(id, {
        id,
        name: getDistributorName(createdBy),
        email: getDistributorEmail(createdBy),
        phoneNumber: getDistributorPhone(createdBy),
        avatarUrl: getDistributorAvatar(createdBy),
        totalRequests: 1,
        latestRequestAt: submittedAt ?? null,
        countries,
        products: [product],
      });
      continue;
    }

    current.totalRequests += 1;
    current.countries = Array.from(new Set([...current.countries, ...countries]));
    current.products.push(product);

    if (
      submittedAt &&
      (!current.latestRequestAt ||
        new Date(submittedAt).getTime() > new Date(current.latestRequestAt).getTime())
    ) {
      current.latestRequestAt = submittedAt;
    }
  }

  return [...grouped.values()]
    .map(({ products: distributorProducts, ...summary }) => ({
      ...summary,
      ...buildDistributorVerificationSnapshot(distributorProducts),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const buildDistributorVerificationCounts = (distributors: OemDistributorSummary[]) =>
  distributors.reduce(
    (accumulator, distributor) => {
      if (distributor.verificationStatus === "verified") {
        accumulator.verified += 1;
      } else {
        accumulator.pending += 1;
      }

      return accumulator;
    },
    { verified: 0, pending: 0 },
  );

export const buildWeeklyRequestData = (products: Product[]) => {
  const labels = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayToIndex = new Map([
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 4],
    [6, 5],
    [0, 6],
  ]);
  const counts = Array.from({ length: 7 }, () => 0);

  products.forEach((product) => {
    const value = product.submittedAt ?? product.createdAt;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const index = dayToIndex.get(date.getDay());

    if (typeof index === "number") {
      counts[index] += 1;
    }
  });

  return labels.map((name, index) => ({
    name,
    value: counts[index],
  }));
};

export const buildSpecificationList = (product: Product | null | undefined): string[] => {
  if (!product) {
    return [];
  }

  const combined = new Set<string>();

  if (product.keySpecifications) {
    product.keySpecifications
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => combined.add(item));
  }

  product.key_attributes?.industry_specific?.forEach((item) => {
    const label = item.label || item.spec || "";
    const value = item.value || item.detail || "";
    const text = [label, value].filter(Boolean).join(": ").trim();

    if (text) {
      combined.add(text);
    }
  });

  product.key_attributes?.other?.forEach((item) => {
    const label = item.label || item.spec || "";
    const value = item.value || item.detail || "";
    const text = [label, value].filter(Boolean).join(": ").trim();

    if (text) {
      combined.add(text);
    }
  });

  return [...combined];
};

export const extractEditableModel = (product: Product | null | undefined): string => {
  if (!product) {
    return "";
  }

  const modelItem = product.key_attributes?.other?.find((item) => {
    const label = (item.label || item.spec || "").toLowerCase();

    return label === "model";
  });

  return modelItem?.value || modelItem?.detail || "";
};

export const buildCustomSpecificationsText = (product: Product | null | undefined): string => {
  if (!product?.key_attributes?.other?.length) {
    return "";
  }

  return product.key_attributes.other
    .filter((item) => {
      const label = (item.label || item.spec || "").toLowerCase();
      return label !== "model";
    })
    .map((item) => {
      const label = item.label || item.spec || "";
      const value = item.value || item.detail || "";
      return [label, value].filter(Boolean).join(": ").trim();
    })
    .filter(Boolean)
    .join("\n");
};

/** @see formatProductCountriesLabel — shared display for product country code arrays */
export const buildCountryLabel = formatProductCountriesLabel;
