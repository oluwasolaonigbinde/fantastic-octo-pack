"use client";

import {
  ArrowRight,
  Award,
  BriefcaseMedical,
  CheckCircle2,
  EyeOff,
  FileText,
  MapPin,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button, Skeleton } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import productService from "@/services/productService";
import type { Product, ProductListResponse } from "@/types/product";
import Header from "../../component/header";

const PAGE_SIZE = 4;

function joinStoreValues(values?: string[]): string {
  return values?.length ? values.join(", ") : "Not provided";
}

function joinProductValues(values?: string[]): string {
  return values?.length ? values.join(", ") : "Not provided";
}

function formatRating(rating?: number, reviewCount?: number): string {
  if (typeof rating !== "number" || !Number.isFinite(rating)) {
    return "No ratings yet";
  }

  if (typeof reviewCount !== "number" || !Number.isFinite(reviewCount)) {
    return String(rating);
  }

  return `${rating} (${reviewCount} ratings)`;
}

function HideBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-1"
      style={{ background: "#EAF9FF" }}
    >
      <EyeOff className="size-4" style={{ color: "#03265C" }} />
      <span className="text-sm" style={{ color: "#03265C" }}>
        Hide
      </span>
    </span>
  );
}

function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.find((image) => image.isDefault)?.url || product.images?.[0]?.url;

  return (
    <div className="flex flex-col overflow-hidden rounded-[19px] border bg-white" style={{ borderColor: "#DDE0E5" }}>
      <div
        className="relative flex h-[193px] items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FDFDFE 39%, #E0E3E8 100%)" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4"
          />
        ) : (
          <div
            className="flex h-[85%] w-[90%] items-center justify-center rounded-xl border bg-white/60"
            style={{ borderColor: "#F3F4F6" }}
          >
            <BriefcaseMedical className="size-16 text-gray4" />
          </div>
        )}
      </div>

      <p className="line-clamp-2 px-3 pt-3 text-[15px] font-medium leading-relaxed text-gray1">
        {product.name}
      </p>

      <div className="flex flex-1 items-end justify-between gap-3 px-3 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3 shrink-0 text-gray2" />
            <span className="truncate text-xs text-gray2">
              Quantity: {product.quantityAvailable ?? "Not provided"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0 text-gray2" />
            <span className="truncate text-xs text-gray2">
              Countries: {joinProductValues(product.countries)}
            </span>
          </div>
        </div>

        <div className="rounded-md px-2 py-1" style={{ background: "rgba(254,110,0,0.04)" }}>
          <span className="text-[17px] font-bold" style={{ color: "#E89F5E" }}>
            {product.pricePerUnit ?? "Not provided"}
          </span>
        </div>
      </div>

      <div className="border-t px-3 py-3" style={{ background: "#F6F7F9" }}>
        <span className="text-sm text-gray2">
          Condition: {product.condition || "Not provided"}
        </span>
      </div>
    </div>
  );
}

export default function DistributorStorePage() {
  const { data: authData } = useAppSelector((state) => state.auth);
  const storeProfile = authData?.distributorStoreProfile;
  const token = authData?.tokens?.accessToken;

  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productMeta, setProductMeta] = useState<ProductListResponse["data"] | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!token) {
      setProducts([]);
      setProductMeta(null);
      return () => {
        ignore = true;
      };
    }

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductError("");
        const result = await productService.fetchWithFilter({
          token,
          page: productPage,
          limit: PAGE_SIZE,
        });

        if (ignore) return;

        setProducts(result.data.docs);
        setProductMeta(result.data);
      } catch (error) {
        if (ignore) return;

        setProducts([]);
        setProductMeta(null);
        setProductError(
          error instanceof Error
            ? error.message
            : "Unable to load distributor products.",
        );
      } finally {
        if (!ignore) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, [productPage, token]);

  const cityStateCountry = [storeProfile?.city, storeProfile?.state, storeProfile?.country]
    .filter(Boolean)
    .join(", ");
  const resolvedTotalPages = Math.max(1, productMeta?.totalPages ?? 1);

  return (
    <div>
      <Header title="Store" description="View and manage your store profile" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Hero: banner + logo/CTA in one column. Logo overlaps banner (pulled up); CTA is always below logo, never beside. */}
        <div className="relative w-full">
          <div
            className="relative z-0 h-[272px] overflow-hidden rounded-[20px]"
            style={{ background: "linear-gradient(135deg, #0669D9 0%, #03265C 100%)" }}
          >
            {storeProfile?.coverPhoto?.url ? (
              <Image
                src={storeProfile.coverPhoto.url}
                alt="Store cover"
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 z-[1] bg-black/50 backdrop-blur-[2px]" />

            <div className="absolute left-9 top-[82px] z-[2]">
              <h1 className="font-black leading-tight text-white" style={{ fontSize: "clamp(32px,4vw,52px)" }}>
                {storeProfile?.businessName || "Store name not provided"}
              </h1>
            </div>

            <div
              className="absolute right-5 top-5 z-[2] flex h-[51px] w-[51px] items-center justify-center overflow-hidden rounded-lg"
              style={{ background: "rgba(255,255,255,0.4)" }}
            >
              {storeProfile?.storeLogo?.url ? (
                <Image
                  src={storeProfile.storeLogo.url}
                  alt="Store logo"
                  width={51}
                  height={51}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BriefcaseMedical className="size-6 text-white" />
              )}
            </div>
          </div>

          <div
            className="relative z-[3] -mt-[72px] w-full min-w-0"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr)",
              gridAutoRows: "auto",
              rowGap: "2.4375rem",
              justifyItems: "start",
            }}
          >
            <div
              className="flex h-40 w-40 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-full border shadow-[0_18px_30px_rgba(15,37,79,0.12)]"
              style={{ background: "#EAF9FF", borderColor: "#DDE0E5" }}
            >
              {storeProfile?.storeLogo?.url ? (
                <Image
                  src={storeProfile.storeLogo.url}
                  alt="Store logo"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <BriefcaseMedical className="size-12 text-gray2" />
                  <span className="text-lg font-semibold text-gray2">Logo</span>
                </>
              )}
            </div>

            <div className="w-full min-w-0 max-w-[20rem] lg:max-w-[22rem]">
              <Link href="/dashboard/distributor/store/edit" className="block w-full">
                <Button
                  title="Edit Store Info"
                  iconLeft={<Pencil className="size-5" />}
                  className="!h-16 !w-full !rounded-[14px] sm:!w-72 lg:!w-80"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border bg-white p-6 md:p-10" style={{ borderColor: "#DDE0E5" }}>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-black">About Distributor</h2>
            <p className="text-lg leading-relaxed text-gray2">
              {storeProfile?.about || "No store profile has been provided yet."}
            </p>
          </div>

          <hr className="my-8" style={{ borderColor: "#DDE0E5" }} />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black">Distributor&apos;s Information</h2>

            <div className="space-y-0">
              {[
                { label: "Countries covered:", value: joinStoreValues(storeProfile?.countriesCovered) },
                { label: "Date founded:", value: storeProfile?.dateFounded || "Not provided" },
                { label: "Categories:", value: joinStoreValues(storeProfile?.categories) },
                { label: "City, State & Country:", value: cityStateCountry || "Not provided", hideOption: true },
                { label: "Address:", value: storeProfile?.address || "Not provided", hideOption: true },
                { label: "Ratings", value: formatRating(authData?.rating, authData?.reviewCount), hideOption: true },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 py-5 ${i < arr.length - 1 ? "border-b" : ""}`}
                  style={i < arr.length - 1 ? { borderColor: "#F3F4F6" } : {}}
                >
                  <span className="text-lg text-gray2">{row.label}</span>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-right text-lg text-gray1">{row.value}</span>
                    {row.hideOption && <HideBadge />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border p-5" style={{ borderColor: "#F3F4F6" }}>
            <div className="mb-4 flex items-center gap-2">
              <Award className="size-5 text-gray2" />
              <span className="text-lg font-semibold text-gray2">Certification</span>
            </div>
            <div
              className="flex flex-wrap gap-2 rounded-lg p-3"
              style={{
                background: "rgba(107,114,128,0.06)",
                border: "1px dashed rgba(107,114,128,0.4)",
              }}
            >
              {storeProfile?.certifications?.length ? (
                storeProfile.certifications.map((cert) => (
                  <a
                    key={cert.cloudinary_id}
                    href={cert.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded px-2 py-1"
                  >
                    <FileText className="size-4 shrink-0 text-gray2" />
                    <span className="text-sm font-medium text-gray2">{cert.name}</span>
                  </a>
                ))
              ) : (
                <span className="text-sm font-medium text-gray2">
                  No certifications uploaded yet.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray1">Listed Product</h2>
            <Link
              href="/dashboard/distributor/catalogue"
              className="flex items-center gap-1 text-base text-primary hover:underline"
            >
              See All Products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {productError ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {productError}
            </div>
          ) : null}

          {isLoadingProducts ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <Skeleton key={index} className="h-[330px] rounded-[19px]" />
              ))}
            </div>
          ) : products.length ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray5 bg-white px-5 py-8 text-center text-gray2">
              No products have been returned for this distributor yet.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-gray1">
              <span>Page</span>
              <span className="inline-flex min-w-[40px] justify-center rounded-xl border px-3 py-2 text-gray1" style={{ borderColor: "#DDE0E5" }}>
                {productMeta?.page ?? productPage}
              </span>
              <span>of {resolvedTotalPages}</span>
            </div>
            <div className="flex gap-2">
              <Button
                title="Previous"
                variant="secondaryLight"
                size="sm"
                className="!w-auto"
                disabled={!productMeta?.hasPreviousPage}
                onClick={() => setProductPage((page) => Math.max(1, page - 1))}
              />
              <Button
                title="Next"
                size="sm"
                className="!w-auto"
                disabled={!productMeta?.hasNextPage}
                onClick={() => setProductPage((page) => Math.min(resolvedTotalPages, page + 1))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
