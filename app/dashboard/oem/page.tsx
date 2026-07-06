"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  ClipboardList,
  Lock,
  MapPinned,
  PackageCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import Header from "../component/header";
import { Button } from "@/components/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";
import { useOemListingRequestsQuery } from "@/hooks/queries/products";
import type { Product } from "@/types/product";

import { buildDistributorSummaries, normalizeOemStatus } from "./oem-ui";

type DashboardMetric = {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
  toneClassName: string;
  iconClassName: string;
};

type OverviewSlice = {
  label: string;
  value: number;
  color: string;
};

type TrendPoint = {
  label: string;
  value: number;
};

type DistributorRow = {
  id: string;
  name: string;
  location: string;
  productRepresented: string;
  dateAuthorized: string;
  status: "active" | "pending";
};

type MappingRow = {
  id: string;
  distributor: string;
  product: string;
  requestType: string;
  status: "active" | "pending";
  requestedOn: string;
};

const FALLBACK_OVERVIEW_SLICES: OverviewSlice[] = [
  { label: "New Request", value: 120, color: "#1F6FD7" },
  { label: "In Progress", value: 120, color: "#FE7B2D" },
  { label: "Completed", value: 68, color: "#1FB574" },
  { label: "Rejected", value: 36, color: "#EF4444" },
];

const FALLBACK_TREND_POINTS: TrendPoint[] = [
  { label: "May 7", value: 18 },
  { label: "May 17", value: 44 },
  { label: "May 21", value: 82 },
  { label: "May 28", value: 22 },
];

const FALLBACK_DISTRIBUTORS: DistributorRow[] = [
  {
    id: "healthplus",
    name: "HealthPlus Solution",
    location: "lagos",
    productRepresented: "Equipment",
    dateAuthorized: "17/09/2025 - 03:56pm",
    status: "active",
  },
  {
    id: "meddistribute",
    name: "MedDistribute",
    location: "kano",
    productRepresented: "Equipment",
    dateAuthorized: "17/09/2025 - 03:55pm",
    status: "pending",
  },
];

const FALLBACK_MAPPING_ROWS: MappingRow[] = [
  {
    id: "mapping-1",
    distributor: "HealthPlus Solution",
    product: "lagos",
    requestType: "Equipment",
    status: "active",
    requestedOn: "17/09/2022",
  },
  {
    id: "mapping-2",
    distributor: "None of the distributor",
    product: "Abuja",
    requestType: "Equipment",
    status: "active",
    requestedOn: "17/09/2022",
  },
];

const DIRECT_SALES_REQUIREMENTS = [
  "Product must not have a verified Nigerian distributor",
  "Your OEM account must be verified",
  "Active Direct Sales subscription",
  "Buy transaction and escrow policies apply",
  "Products cannot be supported by Buy",
];

const DIRECT_SALES_BENEFITS = [
  "Product shows as direct from manufacturer",
  "Your OEM account is visible to verified buyers",
  "Active Direct Sales subscription",
  "Buy transaction and escrow policies still apply",
  "Products are subject to approval by Buy",
];

const formatDateTimeLabel = (value?: string | null) => {
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

const formatRequestType = (category?: string) => {
  if (!category) {
    return "Equipment";
  }

  return category.toLowerCase().includes("consumable")
    ? "Consumables"
    : "Equipment";
};

const formatLocation = (countries?: string[]) => {
  if (!countries?.length) {
    return "lagos";
  }

  return countries[0].toLowerCase();
};

const buildLiveDistributorRows = (products: Product[]): DistributorRow[] => {
  const rows = new Map<string, DistributorRow>();

  for (const product of products) {
    const createdBy = product.createdBy;
    const distributorId =
      typeof createdBy === "string" ? createdBy : createdBy?._id ?? product._id;

    if (rows.has(distributorId)) {
      continue;
    }

    const name =
      typeof createdBy === "string"
        ? "Authorized Distributor"
        : `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim() ||
          "Authorized Distributor";

    rows.set(distributorId, {
      id: distributorId,
      name,
      location: formatLocation(product.countries),
      productRepresented: formatRequestType(product.category),
      dateAuthorized: formatDateTimeLabel(product.updatedAt ?? product.submittedAt),
      status:
        normalizeOemStatus(product.oemApprovalStatus) === "approved"
          ? "active"
          : "pending",
    });
  }

  return [...rows.values()].slice(0, 6);
};

const buildLiveMappingRows = (products: Product[]): MappingRow[] =>
  products.slice(0, 6).map((product) => {
    const createdBy = product.createdBy;
    const distributor =
      typeof createdBy === "string"
        ? "Distributor"
        : `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim() ||
          "Distributor";

    return {
      id: product._id,
      distributor,
      product: product.name,
      requestType: formatRequestType(product.category),
      status:
        normalizeOemStatus(product.oemApprovalStatus) === "approved"
          ? "active"
          : "pending",
      requestedOn: formatDateTimeLabel(product.submittedAt ?? product.createdAt),
    };
  });

const buildGradient = (segments: OverviewSlice[]) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return "conic-gradient(#DDE7F5 0deg 360deg)";
  }

  let current = 0;

  const stops = segments.map((segment) => {
    const start = current;
    const angle = (segment.value / total) * 360;
    current += angle;
    return `${segment.color} ${start}deg ${current}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
};

const DashboardMetricCard = ({ metric }: { metric: DashboardMetric }) => (
  <article className="rounded-[22px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#6E7C91]">{metric.label}</p>
        <p className="mt-2 text-[26px] font-semibold leading-none text-[#18263A] md:text-[30px]">
          {metric.value}
        </p>
      </div>
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl",
          metric.toneClassName,
        )}
      >
        <span className={metric.iconClassName}>{metric.icon}</span>
      </div>
    </div>
    <p className="mt-3 text-xs text-[#8A98AB]">{metric.detail}</p>
  </article>
);

const OverviewChart = ({ segments }: { segments: OverviewSlice[] }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = buildGradient(segments);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="flex justify-center lg:justify-start">
        <div
          className="relative flex size-[154px] items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex size-[96px] flex-col items-center justify-center rounded-full bg-white text-[#18263A]">
            <span className="text-[30px] font-semibold leading-none">{total}</span>
            <span className="mt-1 text-xs text-[#7D8A9C]">Total</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {segments.map((segment) => {
          const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;

          return (
            <div
              key={segment.label}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm text-[#536277]"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}</span>
              <span className="font-medium text-[#18263A]">
                {segment.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrendChart = ({ points }: { points: TrendPoint[] }) => {
  const chartHeight = 170;
  const chartWidth = 520;
  const paddingX = 24;
  const paddingTop = 16;
  const paddingBottom = 24;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = chartWidth - paddingX * 2;
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth;

  const coordinates = points.map((point, index) => {
    const x = paddingX + index * stepX;
    const y =
      paddingTop + usableHeight - (point.value / maxValue) * usableHeight;

    return { ...point, x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${coordinates.at(-1)?.x ?? paddingX} ${
    chartHeight - paddingBottom
  } L ${coordinates[0]?.x ?? paddingX} ${chartHeight - paddingBottom} Z`;

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-[190px] w-full"
        role="img"
        aria-label="Jobs trend"
      >
        <defs>
          <linearGradient id="oem-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4A97F5" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#4A97F5" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((index) => {
          const y = paddingTop + (usableHeight / 3) * index;

          return (
            <line
              key={index}
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={y}
              y2={y}
              stroke="#E8EEF7"
              strokeDasharray="4 6"
            />
          );
        })}

        <path d={areaPath} fill="url(#oem-trend-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#3D8BE7"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coordinates.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#3D8BE7" />
            <circle cx={point.x} cy={point.y} r="9" fill="#3D8BE7" fillOpacity="0.08" />
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-4 gap-2 text-center text-xs text-[#7D8A9C]">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

const StatusChip = ({ status }: { status: "active" | "pending" }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      status === "active"
        ? "bg-[#E8FFF0] text-[#1E9E56]"
        : "bg-[#FFF4DD] text-[#E89A22]",
    )}
  >
    {status === "active" ? "Active" : "Pending"}
  </span>
);

const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: string;
}) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 className="text-lg font-semibold text-[#18263A]">{title}</h3>
      <p className="text-sm text-[#7D8A9C]">{subtitle}</p>
    </div>
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm font-medium text-[#1F6FD7]"
    >
      <span>{action}</span>
      <ArrowRight size={15} />
    </button>
  </div>
);

const DetailPanel = ({
  title,
  toneClassName,
  items,
}: {
  title: string;
  toneClassName: string;
  items: string[];
}) => (
  <div className={cn("rounded-[18px] border px-4 py-4", toneClassName)}>
    <h4 className="text-sm font-semibold text-[#18263A]">{title}</h4>
    <ul className="mt-4 space-y-3 text-sm text-[#5F6D83]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex size-4 items-center justify-center rounded-full bg-white/80 text-[#1F6FD7]">
            <Check size={12} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default function OEMDashboardPage() {
  const { data } = useAppSelector((state) => state.auth);
  const { data: oemListing } = useOemListingRequestsQuery(
    { assignedOem: data?._id, populate: "createdBy", limit: 12 },
    { enabled: Boolean(data?._id && data?.tokens?.accessToken) },
  );
  const oemListingRequests = oemListing?.requests ?? null;
  const [directSalesModalOpen, setDirectSalesModalOpen] = useState(false);
  const [directSalesEnabled, setDirectSalesEnabled] = useState(false);

  const products = useMemo(() => oemListingRequests ?? [], [oemListingRequests]);
  const distributors = useMemo(() => buildDistributorSummaries(products), [products]);
  const hasLiveData = products.length > 0;

  const approvedProducts = useMemo(
    () =>
      products.filter(
        (product) => normalizeOemStatus(product.oemApprovalStatus) === "approved",
      ),
    [products],
  );
  const pendingProducts = useMemo(
    () =>
      products.filter(
        (product) => normalizeOemStatus(product.oemApprovalStatus) === "pending",
      ),
    [products],
  );
  const rejectedProducts = useMemo(
    () =>
      products.filter(
        (product) => normalizeOemStatus(product.oemApprovalStatus) === "rejected",
      ),
    [products],
  );

  const statesCovered = useMemo(() => {
    const uniqueStates = new Set<string>();

    products.forEach((product) => {
      (product.countries ?? []).forEach((country) => uniqueStates.add(country));
    });

    return uniqueStates.size;
  }, [products]);

  const metricCards = useMemo<DashboardMetric[]>(() => {
    const fallbackValues = [325, 518, 12, 84];
    const dynamicValues = [
      distributors.length,
      products.length,
      statesCovered,
      pendingProducts.length,
    ];

    return [
      {
        label: "Authorized Distributors",
        value: hasLiveData ? dynamicValues[0] : fallbackValues[0],
        detail: hasLiveData ? "From your network" : "Active + verified",
        icon: <Users size={20} />,
        toneClassName: "bg-[#E9F2FF]",
        iconClassName: "text-[#58A7FF]",
      },
      {
        label: "Active Product",
        value: hasLiveData ? dynamicValues[1] : fallbackValues[1],
        detail: hasLiveData ? "Across categories" : "Across categories",
        icon: <PackageCheck size={20} />,
        toneClassName: "bg-[#FCEAFF]",
        iconClassName: "text-[#E15FFF]",
      },
      {
        label: "States Covered",
        value: hasLiveData ? dynamicValues[2] : fallbackValues[2],
        detail: hasLiveData ? "Across Nigeria" : "Across Nigeria",
        icon: <MapPinned size={20} />,
        toneClassName: "bg-[#ECFAF0]",
        iconClassName: "text-[#3FC975]",
      },
      {
        label: "Pending Mapping Request",
        value: hasLiveData ? dynamicValues[3] : fallbackValues[3],
        detail: hasLiveData ? "Requires review" : "Requires action",
        icon: <ClipboardList size={20} />,
        toneClassName: "bg-[#FFF4DE]",
        iconClassName: "text-[#F0B42B]",
      },
    ];
  }, [distributors.length, hasLiveData, pendingProducts.length, products.length, statesCovered]);

  const overviewSlices = useMemo<OverviewSlice[]>(() => {
    if (!hasLiveData) {
      return FALLBACK_OVERVIEW_SLICES;
    }

    const approved = approvedProducts.length;
    const pending = pendingProducts.length;
    const rejected = rejectedProducts.length;
    const inProgress = Math.max(1, Math.round(pending / 2));

    return [
      { label: "New Request", value: products.length, color: "#1F6FD7" },
      { label: "In Progress", value: inProgress, color: "#FE7B2D" },
      { label: "Completed", value: approved, color: "#1FB574" },
      { label: "Rejected", value: rejected, color: "#EF4444" },
    ];
  }, [approvedProducts.length, hasLiveData, pendingProducts.length, products.length, rejectedProducts.length]);

  const trendPoints = hasLiveData
    ? FALLBACK_TREND_POINTS.map((point, index) => ({
        ...point,
        value: [18, Math.max(products.length * 2, 24), Math.max(approvedProducts.length * 4, 32), 16][
          index
        ],
      }))
    : FALLBACK_TREND_POINTS;

  const distributorRows = hasLiveData
    ? buildLiveDistributorRows(products)
    : FALLBACK_DISTRIBUTORS;
  const mappingRows = hasLiveData ? buildLiveMappingRows(products) : FALLBACK_MAPPING_ROWS;

  return (
    <>
      <Header title="Dashboard Overview" mobileChrome="dashboard" />

      <div
        className="space-y-4 bg-[#F5F7FB] p-4 md:space-y-5 md:p-6"
        data-testid="oem-dashboard-page"
      >
        <section className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[#18263A]">Direct Sales</h2>
                <CircleHelp size={16} className="text-[#8FA0B7]" />
              </div>
              <p className="max-w-[720px] text-sm text-[#7D8A9C]">
                Display and sell product directly on Baiy when no verified distributor
                exists for that selected product.
              </p>
              <span className="inline-flex items-center rounded-full bg-[#EFF5FB] px-3 py-1 text-xs text-[#7A8AA0]">
                Available only for product without verified distributors
              </span>
            </div>

            <Button
              title={directSalesEnabled ? "Direct Sales Enabled" : "Enable Direct Sales"}
              variant="primaryLight"
              iconRight={<ArrowRight size={16} />}
              onClick={() => setDirectSalesModalOpen(true)}
              data-testid="oem-direct-sales-trigger"
              className={cn(
                "rounded-2xl border-[#FE7B2D] bg-[#FE7B2D] px-5 text-white hover:bg-[#E56B22] lg:w-auto lg:border-[#9DCAFF] lg:bg-[#F7FBFF] lg:text-[#1F6FD7] lg:hover:bg-[#EEF6FF]",
                directSalesEnabled &&
                  "border-[#9CE2B6] bg-[#EAFBF0] text-[#1B8D4E] hover:bg-[#DFF7E8] lg:text-[#1B8D4E]",
              )}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[#1F6FD7] md:text-lg">
                  Analytics and marketing intelligence
                </h2>
                <span className="rounded-full bg-[#FFF1B8] px-3 py-1 text-[11px] font-medium text-[#C68A12]">
                  Premium module
                </span>
              </div>
              <p className="mt-2 text-sm text-[#7D8A9C]">
                Unlock market demand, trends, competitor insight and performance
                analytics.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E5EBF4] bg-white px-4 py-3 text-sm font-medium text-[#5B697E]"
            >
              <span>Explore the Insight</span>
              <Lock size={15} />
            </button>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          data-testid="oem-stats-grid"
        >
          {metricCards.map((metric) => (
            <DashboardMetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
          <article className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#18263A]">
                  Job Requests Overview
                </h3>
              </div>
              <span className="text-xs font-medium text-[#7D8A9C]">This week</span>
            </div>
            <OverviewChart segments={overviewSlices} />
          </article>

          <article className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#18263A]">Jobs Trend</h3>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#7D8A9C]">
                <TrendingUp size={14} className="text-[#1F6FD7]" />
                This month
              </span>
            </div>
            <TrendChart points={trendPoints} />
          </article>
        </section>

        <section className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
          <SectionHeader
            title="Distributors"
            subtitle="Your authorized network"
            action="View All Distributors"
          />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#EDF2F8] text-xs uppercase tracking-[0.04em] text-[#8A98AB]">
                  <th className="py-3 font-medium">Distributors</th>
                  <th className="py-3 font-medium">Location</th>
                  <th className="py-3 font-medium">Product Represented</th>
                  <th className="py-3 font-medium">Date Authorized</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {distributorRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F3F6FA] text-sm text-[#3C4C63]">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-[#FFE8D7] text-xs font-semibold text-[#9A5526]">
                          {row.name
                            .split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 capitalize">{row.location}</td>
                    <td className="py-4">{row.productRepresented}</td>
                    <td className="py-4 whitespace-nowrap">{row.dateAuthorized}</td>
                    <td className="py-4">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-[#1F6FD7]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#E6EDF7] bg-white p-4 shadow-sm md:p-5">
          <SectionHeader
            title="Product Mapping Request"
            subtitle="Your authorized network"
            action="View All Request"
          />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#EDF2F8] text-xs uppercase tracking-[0.04em] text-[#8A98AB]">
                  <th className="py-3 font-medium">Distributors</th>
                  <th className="py-3 font-medium">Product</th>
                  <th className="py-3 font-medium">Request Type</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Requested On</th>
                  <th className="py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {mappingRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F3F6FA] text-sm text-[#3C4C63]">
                    <td className="py-4">{row.distributor}</td>
                    <td className="py-4">{row.product}</td>
                    <td className="py-4">{row.requestType}</td>
                    <td className="py-4">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="py-4 whitespace-nowrap">{row.requestedOn}</td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-[#1F6FD7]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={directSalesModalOpen} onOpenChange={setDirectSalesModalOpen}>
        <DialogContent
          className="max-w-[720px] rounded-[30px] border border-[#E7EEF8] p-0"
          data-testid="oem-direct-sales-modal"
        >
          <div className="p-6 md:p-8">
            <DialogHeader className="space-y-4 text-left">
              <DialogTitle className="text-[26px] font-semibold text-[#18263A]">
                About Direct Sales
              </DialogTitle>
              <DialogDescription className="max-w-[560px] text-sm leading-6 text-[#66758B]">
                Direct sales allows you to display and sell your product directly on
                Baiy as a manufacturer, when no verified Nigerian distributor exists
                for the selected product.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailPanel
                title="Requirements"
                toneClassName="border-[#CCE0FF] bg-[#F3F8FF]"
                items={DIRECT_SALES_REQUIREMENTS}
              />
              <DetailPanel
                title="What you get"
                toneClassName="border-[#D7F3D8] bg-[#F4FFF5]"
                items={DIRECT_SALES_BENEFITS}
              />
            </div>

            <div className="mt-6">
              <Button
                title="Continue"
                className="rounded-2xl"
                onClick={() => {
                  setDirectSalesEnabled(true);
                  setDirectSalesModalOpen(false);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
