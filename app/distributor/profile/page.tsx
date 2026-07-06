"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useProductsQuery } from "@/hooks/queries/products";
import { useUserQuery } from "@/hooks/queries/users";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Flag,
  Home,
  ImageIcon,
  MessageCircleMore,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { PublicLayout } from "@/components/layout";
import { useAppSelector } from "@/hooks/useAppSelector";
import type { Product } from "@/types/product";
import type { PublicProfileData } from "@/types/user";
import {
  getProductAvailabilityLabel,
  getProductDefaultImageUrl,
  getPrimaryProductLocation,
} from "@/utils/productDisplay";
import {
  clearPendingAuthIntent,
  writePendingAuthIntent,
} from "@/utils/pendingAuth";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";

const ITEMS_PER_PAGE = 8;

function formatPrice(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "RFQ";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRating(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "No ratings yet";
  }

  return value.toFixed(1);
}

function buildName(profile?: PublicProfileData | null): string {
  if (!profile) {
    return "Distributor Profile";
  }

  return (
    profile.distributorStoreProfile?.businessName?.trim() ||
    `${profile.firstName} ${profile.lastName}`.trim() ||
    "Distributor Profile"
  );
}

function buildRegisterHref(selectedId: string): string {
  if (!selectedId) {
    return "/register";
  }

  return `/register?redirect=${encodeURIComponent(`/distributor/profile?id=${selectedId}`)}`;
}

function BadgePill({
  icon,
  text,
  tone = "blue",
  className = "",
}: {
  icon: ReactNode;
  text: string;
  tone?: "green" | "amber" | "blue";
  className?: string;
}) {
  const toneClass = {
    green: "border-[#d4f0dd] bg-[#f5fbf7] text-[#4ca56c]",
    amber: "border-[#ffe8bb] bg-[#fff9eb] text-[#d89b17]",
    blue: "border-[#d8e6ff] bg-[#f4f8ff] text-[#5b8cd6]",
  }[tone];

  return (
    <span
      className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-[7px] border px-3 text-[10px] font-semibold ${toneClass} ${className}`}
    >
      {icon}
      {text}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#eef2f6] py-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] text-[#7e8da3]">{label}</span>
      <span className="text-right text-[11px] font-medium text-[#344760]">{value}</span>
    </div>
  );
}

function GalleryImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative h-[88px] overflow-hidden rounded-[7px] bg-[#f3f6fa] sm:h-[104px]">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, 260px"
        className="object-cover"
      />
    </div>
  );
}

function ProfileMediaPanel({
  coverPhotoUrl,
  distributorName,
  products,
}: {
  coverPhotoUrl: string;
  distributorName: string;
  products: Product[];
}) {
  const productImages = products
    .map((product) => getProductDefaultImageUrl(product))
    .filter(Boolean)
    .slice(0, 2);
  const galleryImages = productImages.length
    ? productImages
    : [coverPhotoUrl, "/images/product 2.webp"];

  return (
    <section className="rounded-[9px] border border-[#e8edf4] bg-white px-3.5 pb-3.5 pt-2.5 shadow-[0_8px_22px_rgba(15,37,79,0.03)] sm:px-4">
      <div className="mb-2.5 flex items-center gap-5 border-b border-[#edf1f7] pb-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border-b-2 border-[#1f83ff] pb-1.5 text-[11px] font-semibold text-[#38506b]"
        >
          <ImageIcon size={12} />
          Images
        </button>
        <button
          type="button"
          className="pb-1.5 text-[11px] font-medium text-[#8e9bae]"
        >
          Videos
        </button>
      </div>

      <p className="mb-2 text-[11px] font-semibold text-[#344760]">All machinery</p>
      <div className="grid grid-cols-2 gap-2.5 sm:max-w-[280px]">
        <GalleryImage src={galleryImages[0]} alt={`${distributorName} gallery image`} priority />
        <GalleryImage
          src={galleryImages[1] || galleryImages[0]}
          alt={`${distributorName} product image`}
        />
      </div>
    </section>
  );
}

function ProductCard({
  product,
  distributorName,
}: {
  product: Product;
  distributorName: string;
}) {
  const imageSrc = getProductDefaultImageUrl(product);
  const location = getPrimaryProductLocation(product) || distributorName;
  const stockText = getProductAvailabilityLabel(product);

  return (
    <Link
      href={`/products/${product._id}`}
      prefetch={false}
      className="overflow-hidden rounded-[8px] border border-[#ebeff5] bg-white shadow-[0_6px_16px_rgba(15,37,79,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,37,79,0.07)]"
    >
      <div className="relative h-[86px] border-b border-[#eff3f8] bg-[#f8fafc] sm:h-[96px]">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-contain p-3"
        />
      </div>

      <div className="space-y-2 px-3 pb-3 pt-2.5">
        <div>
          <h3 className="line-clamp-2 min-h-[32px] text-[11px] font-semibold leading-4 text-[#344760]">{product.name}</h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-[#93a1b4]">{location}</p>
        </div>

        <div className="flex items-center gap-1 text-[#f8b319]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={10} className="fill-current" />
          ))}
          <span className="ml-1 text-[10px] text-[#8f9caf]">{stockText}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold text-[#fe7a10]">{formatPrice(product.pricePerUnit)}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8a98ab]">
            View
            <ChevronRight size={12} />
          </span>
        </div>

        <p className="text-[10px] text-[#8f9caf]">Condition: {product.condition || "new"}</p>
      </div>
    </Link>
  );
}

function DistributorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id") || "";
  const authData = useAppSelector((state) => state.auth.data);

  const [currentPage, setCurrentPage] = useState(1);

  const profileQuery = useUserQuery(selectedId || undefined);
  const productsQuery = useProductsQuery(
    { createdBy: selectedId, status: "approved", limit: 40 },
    { enabled: Boolean(selectedId) },
  );

  const profile = profileQuery.data ?? null;
  const products: Product[] = productsQuery.data?.products ?? [];
  const loading =
    Boolean(selectedId) && (profileQuery.isLoading || productsQuery.isLoading);
  const error = !selectedId
    ? "No distributor ID provided."
    : profileQuery.isError
      ? profileQuery.error instanceof Error
        ? profileQuery.error.message
        : "Unable to load distributor profile."
      : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedId]);

  const distributorName = buildName(profile);
  const storeProfile = profile?.distributorStoreProfile;
  const bioText = storeProfile?.about?.trim() || "No distributor profile has been provided yet.";
  const coverPhotoUrl = storeProfile?.coverPhoto?.url || "/images/banner.webp";
  const logoUrl = storeProfile?.storeLogo?.url || profile?.displayPhoto?.url || "/images/profile.webp";
  const safeRating = typeof profile?.rating === "number" ? profile.rating : undefined;
  const safeReviewCount =
    typeof profile?.reviewCount === "number" ? profile.reviewCount : undefined;
  const cityStateCountry = [
    storeProfile?.city,
    storeProfile?.state,
    storeProfile?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () => products.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE),
    [products, safeCurrentPage],
  );

  const redirectToRegister = () => {
    router.push(buildRegisterHref(selectedId));
  };

  const handleSendMessage = () => {
    if (!selectedId) {
      return;
    }

    if (!authData?.tokens?.accessToken) {
      writePendingAuthIntent({
        action: "send_message",
        sourcePath: `/distributor/profile?id=${selectedId}`,
        receiverId: selectedId,
      });
      router.push("/login");
      return;
    }

    const composeHref = buildMessagingComposeHref(authData.role, selectedId);

    if (!composeHref) {
      clearPendingAuthIntent();
      router.push("/dashboard");
      return;
    }

    router.push(composeHref);
  };

  return (
    <PublicLayout contentClassName="min-h-screen bg-[#f7f8fb]">
      <main className="bg-[#f7f8fb]">
        <section className="pb-10 pt-4">
          <div className="mx-auto max-w-[1040px] px-4 sm:px-6 lg:px-8">
            <nav className="mb-3 flex items-center gap-2 text-[10px] font-medium text-[#f4a038]">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-[#d96f00]">
                <Home size={12} />
                <span>Home</span>
              </Link>
              <ChevronRight size={11} className="text-[#b8c4d4]" />
              <span className="text-[#8a98ab]">{loading ? "Distributor Profile" : distributorName}</span>
            </nav>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#eef7fb] text-[#7f8ea5] shadow-[0_8px_16px_rgba(15,37,79,0.07)] sm:h-[58px] sm:w-[58px]">
                  <Image
                    src={logoUrl}
                    alt={`${distributorName} profile`}
                    width={58}
                    height={58}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <h1 className="max-w-[620px] text-[18px] font-semibold leading-tight text-[#273950] sm:text-[21px]">
                    {loading ? "Loading distributor..." : distributorName}
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={redirectToRegister}
                className="hidden h-8 items-center justify-center rounded-[6px] border border-[#d8e5f5] bg-white px-4 text-[10px] font-semibold text-[#64778f] transition hover:border-[#c4d5ea] hover:bg-[#f8fbff] sm:inline-flex"
              >
                <ChevronRight size={12} className="mr-1 rotate-180" />
                Go Back
              </button>
            </div>

            <div className="mb-4 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_292px]">
              <div className="grid gap-2 sm:grid-cols-3">
                <BadgePill icon={<BadgeCheck size={12} />} text="Verified Seller" tone="green" />
                <BadgePill icon={<Trophy size={12} />} text="Premium Seller" tone="amber" />
                <BadgePill icon={<Users size={12} />} text="Preferred Distributor" tone="blue" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={redirectToRegister}
                  className="inline-flex h-7 items-center justify-center rounded-[6px] border border-[#d8e5f5] bg-white px-3 text-[10px] font-semibold text-[#64778f] transition hover:border-[#c4d5ea] hover:bg-[#f8fbff]"
                >
                  <Flag size={12} className="mr-1.5" />
                  Report For Scam
                </button>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!selectedId}
                  className="inline-flex h-7 items-center justify-center rounded-[6px] bg-[#1f83ff] px-3 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(31,131,255,0.2)]"
                  title="Send Message"
                >
                  <MessageCircleMore size={12} className="mr-1.5" />
                  Send Message
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 rounded-[24px] border border-[#e8edf4] bg-white px-6 py-12 text-center text-sm text-[#66768c] shadow-[0_10px_30px_rgba(15,37,79,0.04)]">
                Loading distributor profile...
              </div>
            ) : error ? (
              <div className="mt-8 rounded-[24px] border border-[#f7d7d7] bg-[#fff7f7] px-6 py-5 text-sm text-[#b42318]">
                {error}
              </div>
            ) : (
              <>
                <ProfileMediaPanel
                  coverPhotoUrl={coverPhotoUrl}
                  distributorName={distributorName}
                  products={products}
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.72fr)]">
                  <div className="space-y-4">
                    <section className="rounded-[9px] border border-[#e8edf4] bg-white p-4 shadow-[0_8px_22px_rgba(15,37,79,0.03)]">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(190px,0.7fr)]">
                        <div>
                          <h2 className="text-[13px] font-semibold text-[#293a51]">About Distributor</h2>
                          <p className="mt-2 text-[11px] leading-5 text-[#7b899d]">{bioText}</p>

                          <div className="mt-4">
                            <h3 className="text-[11px] font-semibold text-[#4a5d77]">
                              Distributor&apos;s Information
                            </h3>
                            <div className="mt-2">
                              <InfoRow label="Distributor name" value={distributorName} />
                              <InfoRow label="Phone number" value={profile?.phoneNumber || "Not provided"} />
                              <InfoRow label="Address" value={storeProfile?.address || profile?.address || "Not provided"} />
                              <InfoRow label="Date Founded" value={storeProfile?.dateFounded || "Not provided"} />
                              <InfoRow label="Company" value={storeProfile?.businessName || "Not provided"} />
                              <InfoRow label="City / State / Country" value={cityStateCountry || "Not provided"} />
                              <InfoRow
                                label="Ratings"
                                value={
                                  safeReviewCount !== undefined && safeRating !== undefined
                                    ? `${formatRating(safeRating)} (${safeReviewCount} ratings)`
                                    : "No ratings yet"
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[11px] font-semibold text-[#4a5d77]">Distributor&apos;s Partners</h3>
                          <div className="mt-2 space-y-2">
                            <p className="rounded-[8px] border border-dashed border-[#eef2f7] bg-white px-3 py-2.5 text-[11px] text-[#7b899d]">
                              No distributor partners are available yet.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[9px] border border-[#e8edf4] bg-white p-4 shadow-[0_8px_22px_rgba(15,37,79,0.03)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-[13px] font-semibold text-[#293a51]">Customer Reviews</h2>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#738399]">
                            <div className="flex items-center gap-0.5 text-[#f8b319]">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star key={index} size={12} className="fill-current" />
                              ))}
                            </div>
                            <span className="font-semibold text-[#455973]">
                              {safeRating !== undefined
                                ? `${formatRating(safeRating)} / 5`
                                : "No ratings yet"}
                            </span>
                            <span>
                              {safeReviewCount !== undefined
                                ? `${safeReviewCount} Reviews`
                                : "No reviews yet"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={redirectToRegister}
                          className="inline-flex h-8 items-center justify-center rounded-[7px] bg-[#1f83ff] px-4 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(31,131,255,0.18)]"
                        >
                          Share Review
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <p className="rounded-[8px] border border-dashed border-[#edf1f7] bg-white px-4 py-3 text-[11px] text-[#738399]">
                          No customer reviews are available yet.
                        </p>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-4">
                    <section className="rounded-[9px] border border-[#e8edf4] bg-white p-4 shadow-[0_8px_22px_rgba(15,37,79,0.03)]">
                      <h2 className="text-[13px] font-semibold text-[#293a51]">Overview</h2>

                      <div className="mt-3 space-y-4">
                        <div>
                          <p className="text-[16px] font-semibold text-[#273950]">
                            {typeof profile?.experienceYears === "number"
                              ? `${profile.experienceYears}+`
                              : "Not provided"}
                          </p>
                          <p className="mt-1 text-[11px] text-[#8593a5]">Years Experience</p>
                        </div>

                        <div>
                          <p className="text-[16px] font-semibold text-[#273950]">Not provided</p>
                          <p className="mt-1 text-[11px] text-[#8593a5]">Market</p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-[#edf1f7] pt-4">
                        <h3 className="text-[12px] font-semibold text-[#293a51]">Certification</h3>
                        <div className="mt-2.5 space-y-2">
                          {storeProfile?.certifications?.length ? (
                            storeProfile.certifications.map((cert, index) => (
                              <a
                                key={cert.cloudinary_id}
                                href={cert.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 rounded-[8px] border border-[#eef2f7] bg-[#fbfcfe] px-3 py-2.5"
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5fb] text-[11px] font-semibold text-[#7a8aa2]">
                                  {index + 1}
                                </span>
                                <span className="text-[11px] text-[#738399]">{cert.name}</span>
                              </a>
                            ))
                          ) : (
                            <p className="rounded-[8px] border border-dashed border-[#eef2f7] bg-[#fbfcfe] px-3 py-2.5 text-[11px] text-[#738399]">
                              No certifications uploaded yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <section className="mt-4 rounded-[9px] border border-[#e8edf4] bg-white p-4 shadow-[0_8px_22px_rgba(15,37,79,0.03)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-[13px] font-semibold text-[#293a51]">Listed Product</h2>
                    </div>

                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#88a2c6] hover:text-[#5d83bb]"
                    >
                      See all Products
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {totalProducts === 0 ? (
                    <div className="mt-4 rounded-[8px] border border-dashed border-[#d9e4f2] bg-[#fbfdff] px-5 py-4 text-sm text-[#66768c]">
                      No public products are listed for this distributor yet.
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {paginatedProducts.map((product) => (
                          <ProductCard
                            key={product._id}
                            product={product}
                            distributorName={distributorName}
                          />
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="mt-5 flex items-center justify-end gap-3 text-[11px] text-[#92a0b2]">
                          <span>
                            Page {safeCurrentPage} of {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage((page) => (page >= totalPages ? 1 : page + 1))
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#fe7a10] text-white shadow-[0_8px_16px_rgba(254,122,16,0.22)]"
                            aria-label="Next page"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

export default function DistributorProfilePage() {
  return (
    <Suspense fallback={<div className="p-10">Loading distributor...</div>}>
      <DistributorProfileContent />
    </Suspense>
  );
}
