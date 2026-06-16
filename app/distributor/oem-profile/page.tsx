"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleChevronRight,
  Home,
  ShieldCheck,
  Star,
} from "lucide-react";

import { PublicLayout } from "@/components/layout";
import productService from "@/services/productService";
import { userService } from "@/services/userService";
import type { Product } from "@/types/product";
import type { PublicProfileData, UserData } from "@/types/user";
import { readAuthSessionUser } from "@/utils/authSession";

const ITEMS_PER_PAGE = 6;
const OEM_ABOUT_FALLBACK =
  "Figma ipsum component variant main layer. Community image asset overflow community editor distribute prototype layer inspect. Bullet create boolean flatten pen content layer frame clip group. Main duplicate vertical style connection draft. Ipsum ellipse auto content.";

function buildName(profile?: PublicProfileData | null) {
  if (!profile) {
    return "OEM";
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  return fullName || "OEM";
}

function buildRegisterHref(selectedId: string) {
  if (!selectedId) {
    return "/register";
  }

  return `/register?redirect=${encodeURIComponent(`/distributor/oem-profile?id=${selectedId}`)}`;
}

function buildCategoryLabel(profile: PublicProfileData | null, products: Product[]) {
  const profileTags = [...(profile?.oemTags ?? []), ...(profile?.equipmentTypes ?? [])]
    .map((item) => item.trim())
    .filter(Boolean);

  if (profileTags.length > 0) {
    return profileTags.join(", ");
  }

  const productCategories = Array.from(
    new Set(
      products
        .map((product) => product.category?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  return productCategories.length > 0
    ? productCategories.join(", ")
    : "Not publicly listed";
}

function buildDistributorPartners(products: Product[]) {
  const seen = new Set<string>();

  return products.flatMap((product) => {
    const createdBy = product.createdBy;
    if (!createdBy || typeof createdBy === "string") {
      return [];
    }

    const partner = createdBy as UserData;
    if (!partner._id || seen.has(partner._id)) {
      return [];
    }

    seen.add(partner._id);
    return [partner];
  });
}

function buildDistributorSummaries(products: Product[]) {
  const counts = new Map<
    string,
    {
      distributor: UserData;
      productCount: number;
    }
  >();

  for (const product of products) {
    const createdBy = product.createdBy;
    if (!createdBy || typeof createdBy === "string") {
      continue;
    }

    const distributor = createdBy as UserData;
    const existing = counts.get(distributor._id);

    if (existing) {
      existing.productCount += 1;
    } else {
      counts.set(distributor._id, {
        distributor,
        productCount: 1,
      });
    }
  }

  return Array.from(counts.values());
}

function BadgePill({
  label,
  tone,
  icon,
  className = "",
}: {
  label: string;
  tone: "green" | "amber" | "blue";
  icon: ReactNode;
  className?: string;
}) {
  const toneClasses = {
    green: "border-[#ccefdc] bg-[#effaf3] text-[#15824f]",
    amber: "border-[#ffe0bd] bg-[#fff6eb] text-[#cc7516]",
    blue: "border-[#d8e6fb] bg-[#eef5ff] text-[#265ea8]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${toneClasses} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf2f8] py-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[#6f7f94]">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-[#2e4059]">
        {value}
      </span>
    </div>
  );
}

function OfficialDistributorRow({
  partner,
  accent,
}: {
  partner: UserData;
  accent: string;
}) {
  const partnerName =
    `${partner.firstName} ${partner.lastName}`.trim() || "Name of distributor";

  return (
    <Link
      href={`/distributor/profile?id=${partner._id}`}
      className="flex items-center justify-between gap-3 rounded-[14px] border border-[#edf2f8] px-3 py-3 transition hover:border-[#cadef1] hover:bg-[#fbfdff]"
    >
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: accent }}
        >
          <span className="absolute right-[-1px] h-0 w-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-white" />
        </span>
        <span className="text-xs font-medium text-[#223553]">{partnerName}</span>
      </div>
      <CircleChevronRight size={15} className="text-[#3d85dd]" />
    </Link>
  );
}

function FeaturedDistributorCard({
  partner,
  productCount,
}: {
  partner: UserData;
  productCount: number;
}) {
  const partnerName =
    `${partner.firstName} ${partner.lastName}`.trim() || "Distributor Name";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f8] bg-white px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef8ff] text-[#5e748e]">
          <Building2 size={20} />
        </div>
        <div>
          <p className="text-[1.05rem] font-semibold text-[#4b5d77]">{partnerName}</p>
          <div>
            <p className="text-xs text-[#8a97ab]">
              Total numbers of listed product
            </p>
            <p className="mt-1 text-xs font-medium text-[#728197]">
              {productCount} listed item{productCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
      <Link
        href={`/distributor/profile?id=${partner._id}`}
        className="inline-flex items-center gap-2 rounded-[12px] border border-[#edf2f8] bg-[#fbfdff] px-4 py-2 text-sm font-medium text-[#556780] transition hover:border-[#cadef1]"
      >
        View Profile
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function OEMProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id") || "";

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    if (!selectedId) {
      return undefined;
    }

    void (async () => {
      if (cancelled) {
        return;
      }

      setProfileLoading(true);
      try {
        const data = await userService.getPublicProfileById(selectedId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    })();

    void (async () => {
      if (cancelled) {
        return;
      }

      setProductsLoading(true);
      setProductError(null);
      try {
        const response = await productService.fetchWithFilter({
          assignedOem: selectedId,
          populate: "createdBy",
          limit: 24,
        });

        if (!cancelled) {
          setProducts(response.data.docs ?? []);
          setCurrentPage(1);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          setProductError(
            error instanceof Error ? error.message : "Failed to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const oemName = buildName(profile);
  const listedCount = products.length;
  const categoryLabel = buildCategoryLabel(profile, products);
  const distributorPartners = buildDistributorPartners(products);
  const distributorSummaries = buildDistributorSummaries(products);
  const totalPages = Math.max(1, Math.ceil(distributorSummaries.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedDistributors = distributorSummaries.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  const summaryText = profile?.bio?.trim() || OEM_ABOUT_FALLBACK;
  const officialDistributorColors = ["#1f7aff", "#ffbe18", "#1b7fff", "#1bb44d", "#f25c1a"];
  const registerHref = buildRegisterHref(selectedId);

  const handleSourceItem = () => {
    if (readAuthSessionUser()) {
      router.push("/products");
      return;
    }

    router.push(registerHref);
  };

  const handleSendReview = () => {
    if (!readAuthSessionUser()) {
      router.push(registerHref);
    }
  };

  return (
    <PublicLayout contentClassName="min-h-screen bg-[#f7f8fb]">
      <main>
        <section
          className="relative overflow-hidden bg-[#16365d] text-white"
          style={{
            backgroundImage: "url('/images/banner.webp')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,29,55,0.9)_0%,rgba(13,29,55,0.68)_48%,rgba(13,29,55,0.24)_100%)]" />

          <div className="relative mx-auto max-w-[1180px] px-4 pb-24 pt-7 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-[11px] font-medium">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[#f4a038] transition hover:text-white"
              >
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronRight size={12} className="text-white/45" />
              <Link
                href="/distributor"
                className="text-[#f4a038] transition hover:text-white"
              >
                Distributor/OEMs
              </Link>
              <ChevronRight size={12} className="text-white/45" />
              <span className="text-white/70">{oemName}</span>
            </nav>

            <h1 className="mt-6 text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.55rem]">
              OEM Profile
            </h1>
          </div>
        </section>

        <section className="bg-white pb-16">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="absolute left-4 top-0 z-20 -translate-y-[56%] sm:left-6 lg:left-8">
                <div className="flex h-[132px] w-[132px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[34px] bg-[#e8f5ff] text-[#607188] shadow-[0_18px_30px_rgba(15,37,79,0.12)]">
                  <Image
                    src={profile?.displayPhoto?.url || "/images/profile.webp"}
                    alt={`${oemName} profile`}
                    width={132}
                    height={132}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="min-h-[112px] pt-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_290px]">
                  <div className="grid gap-3 pl-[170px] sm:grid-cols-3 lg:pl-[186px]">
                    <BadgePill
                      label="Verified Seller"
                      tone="green"
                      icon={<CheckCircle2 size={12} />}
                      className="justify-center"
                    />
                    <BadgePill
                      label="Premium Supplier"
                      tone="amber"
                      icon={<Star size={12} />}
                      className="justify-center"
                    />
                    <BadgePill
                      label="Authorized Distributor"
                      tone="blue"
                      icon={<ShieldCheck size={12} />}
                      className="justify-center"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleSourceItem}
                      className="inline-flex min-h-9 w-full items-center justify-center rounded-[10px] border border-[#8db9ef] bg-white px-5 text-[11px] font-medium text-[#2457a6] transition hover:border-[#6ba5e7] hover:bg-[#f7fbff]"
                    >
                      Source Item
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Send Message"
                      className="inline-flex min-h-9 w-full items-center justify-center rounded-[10px] bg-[#0d63ce] px-5 text-[11px] font-medium text-white opacity-55"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_290px]">
          <article className="rounded-[22px] border border-[#e8edf5] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(17,43,92,0.05)] sm:px-6">
            <h2 className="text-[1.05rem] font-semibold text-[#2e4059]">About OEM</h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-7 text-[#66768c]">
              {summaryText}
              </p>

              <div className="mt-5">
                <h3 className="text-[1.02rem] font-semibold text-[#2e4059]">
                  OEM Information
                </h3>
                <div className="mt-3">
                  <DetailRow label="Name" value={oemName} />
                  <DetailRow
                    label="Phone Number"
                    value={profile?.phoneNumber?.trim() || "Not publicly listed"}
                  />
                  <DetailRow label="Categories:" value={categoryLabel} />
                  <DetailRow
                    label="Official Address"
                    value={profile?.address?.trim() || "Not publicly listed"}
                  />
                  <DetailRow
                    label="Item Listed"
                    value={`${listedCount} item${listedCount === 1 ? "" : "s"}`}
                  />
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-[#e8edf5] bg-white p-5 shadow-[0_12px_32px_rgba(17,43,92,0.05)]">
              <h2 className="text-[1.05rem] font-semibold text-[#2e4059]">
                Official Distributor
              </h2>

              <div className="mt-4 space-y-3">
                {distributorPartners.length > 0 ? (
                  distributorPartners.slice(0, 5).map((partner, index) => (
                    <OfficialDistributorRow
                      key={partner._id}
                      partner={partner}
                      accent={
                        officialDistributorColors[
                          index % officialDistributorColors.length
                        ]
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-[#d5dfec] bg-[#fbfdff] px-4 py-5 text-sm text-[#728197]">
                    No official distributors are linked to this OEM yet.
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/distributor"
                  className="text-xs font-semibold text-[#3d85dd] transition hover:text-[#1d66c0]"
                >
                  see all
                </Link>
              </div>
            </article>
            </div>

            <section className="mt-6 rounded-[22px] border border-[#e8edf5] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(17,43,92,0.05)] sm:px-6">
              <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[1.45rem] font-semibold tracking-[-0.02em] text-[#4b5d77]">
                  Featured Distributors
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSendReview}
                className="inline-flex min-h-9 w-fit items-center justify-center rounded-[10px] bg-[#0d63ce] px-5 text-xs font-medium text-white"
              >
                Send Review
              </button>
            </div>

            <div className="mt-2">
              {profileLoading || productsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-[18px] bg-[#eef3f8]"
                    />
                  ))}
                </div>
              ) : productError ? (
                <div className="rounded-[18px] border border-[#ffd8d4] bg-[#fff5f4] px-5 py-4 text-sm font-medium text-[#c94f42]">
                  Failed to load products.
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#d5dfec] bg-[#fbfdff] px-5 py-5 text-sm text-[#728197]">
                  No products found for this OEM.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedDistributors.map(({ distributor, productCount }) => (
                      <FeaturedDistributorCard
                        key={distributor._id}
                        partner={distributor}
                        productCount={productCount}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={activePage === 1}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e4f2] text-[#2457a6] transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <span className="text-sm text-[#728197]">
                        Page {activePage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) => Math.min(totalPages, page + 1))
                        }
                        disabled={activePage === totalPages}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e4f2] text-[#2457a6] transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="mt-5">
              <Link
                href="/distributor"
                className="text-xs font-semibold text-[#3d85dd] transition hover:text-[#1d66c0]"
              >
                see all
              </Link>
            </div>
            </section>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default function OEMProfilePage() {
  return (
    <Suspense fallback={<div className="p-10">Loading OEM...</div>}>
      <OEMProfileContent />
    </Suspense>
  );
}
