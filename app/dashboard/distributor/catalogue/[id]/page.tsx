"use client";

// import { Metadata } from "next";

import Header from "../../../component/header";
import ProductImageGallery from "@/app/products/[id]/ProductImageGallery";
import { useProductQuery } from "@/hooks/queries/products";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppSelector";
import { ArrowLeft, Pencil } from "lucide-react";
import { BigLoader, Button } from "@/components/base";
import { useRouter } from "next/navigation";
import { canEditProduct, getListingStatusMeta } from "@/utils/productStatus";
import {
  getProductAvailabilityLabel,
  getProductDefaultImageUrl,
  getProductImageUrls,
  getProductSpecificationItems,
} from "@/utils/productDisplay";

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// export async function generateMetadata({ params }: { params: { id: string } }) {
//   const product = await fetchProductById(params.id);
//   return {
//     title: product?.name || "Product Detail",
//   };
// }

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { data: authData } = useAppSelector((state) => state.auth);
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useProductQuery(id as string, {
    enabled: Boolean(id && authData?.tokens?.accessToken),
  });
  const message = error instanceof Error ? error.message : "";

  const statusMeta = product ? getListingStatusMeta(product.status) : null;
  const isEditable = product ? canEditProduct(product.status) : false;
  const specificationItems = getProductSpecificationItems(product);

  if (isLoading) {
    return (
      <>
        <Header title="Product Listings" />
        <div className="flex min-h-[320px] items-center justify-center p-6">
          <BigLoader />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Product Listings" />
        <div className="m-4 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
          {message || "Unable to load this product right now."}
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header title="Product Listings" />
        <div className="m-4 rounded-2xl border border-gray5 bg-white p-6 text-sm text-gray3">
          This product could not be found.
        </div>
      </>
    );
  }

  const oemBrandingLabel =
    typeof product.brand_oem === "string" && product.brand_oem.trim().length > 0
      ? product.brand_oem
      : product.assignedOem
        ? "OEM selected"
        : "No OEM selected";

  return (
    <>
      <Header title="Product Listings" />

      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/dashboard/distributor/catalogue"
          className="inline-flex items-center gap-2 text-sm text-gray2 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Go Back
        </Link>

        <div className="space-y-4 rounded-[24px] border border-gray5 bg-white p-4 shadow-sm md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border border-gray5 bg-[#F9FBFD] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
                OEM Branding
              </p>
              <p className="mt-3 text-lg font-semibold text-gray1">
                {oemBrandingLabel}
              </p>
              <p className="mt-1 text-sm text-gray3">
                {product.oemApprovalStatus === "approved"
                  ? "OEM badge verified for this listing."
                  : product.oemApprovalStatus === "pending"
                    ? "Awaiting OEM badge review."
                    : "No OEM badge approval attached to this listing."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#C8F2D8] bg-[#F1FFF6] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#2A7A4B]">
                Verification Status
              </p>
              <div className="mt-3">
                {statusMeta ? (
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-gray7 px-3 py-1.5 text-sm font-medium text-gray2">
                    Status unavailable
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[#2A7A4B]">
                Admin approval controls marketplace visibility.
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-t border-gray5 pt-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <ProductImageGallery
              mainImage={getProductDefaultImageUrl(product)}
              thumbnails={getProductImageUrls(product)}
              title={product.name}
            />

            <div className="space-y-5">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-gray1">
                  {product.name}
                </h1>
                <span className="inline-flex rounded-md bg-[#E8F3FF] px-3 py-1.5 text-sm font-medium text-primary">
                  {getProductAvailabilityLabel(product)}
                </span>
                <p className="text-4xl font-bold text-[#12355B]">
                  {formatCurrency(product.pricePerUnit || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray1">
                  Description
                </h2>
                {product.description ? (
                  <p className="text-sm leading-7 text-gray2">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray3">
                    No description provided for this product.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray5 pt-6">
            <h2 className="text-lg font-semibold text-gray1">
              Key Specifications
            </h2>
            {specificationItems.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-gray2">
                {specificationItems.map((spec, index) => (
                  <li key={`${spec.label}-${index}`} className="flex gap-2">
                    <span className="mt-[10px] size-1.5 rounded-full bg-gray2" />
                    <span>
                      <span className="font-semibold text-gray1">
                        {spec.label}
                      </span>
                      {spec.value ? `: ${spec.value}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray3">
                No key specifications provided.
              </p>
            )}
          </div>

          <div className="border-t border-gray5 pt-6">
            {isEditable ? (
              <Button
                title="Edit Product"
                size="md"
                iconLeft={<Pencil className="size-4" />}
                className="w-full rounded-xl md:w-auto md:min-w-[180px]"
                onClick={() => {
                  router.push(`/dashboard/distributor/catalogue/new`);
                }}
              />
            ) : (
              <p className="text-sm text-gray3">
                Editing is locked once a product has been submitted for review.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
