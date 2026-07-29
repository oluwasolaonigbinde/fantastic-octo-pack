"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Header from "../../../component/header";
import { Button, Textarea } from "@/components/base";
import ProductImageGallery from "@/app/products/[id]/ProductImageGallery";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  useProductQuery,
  useReviewProductVisibilityMutation,
} from "@/hooks/queries/products";
import { useCategoriesQuery } from "@/hooks/queries/categories";
import type { UserData } from "@/types/user";
import { getPartyDisplayName } from "@/utils/partyDisplayName";
import { getListingStatusMeta } from "@/utils/productStatus";
import {
  getProductAvailabilityLabel,
  getProductDefaultImageUrl,
  getProductImageUrls,
  getProductSpecificationItems,
  getPricingModeLabel,
  getProductCategoryId,
  getProductCategoryName,
  getProductSubcategoryName,
} from "@/utils/productDisplay";

const formatMoney = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso?: string | null): string => {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB")} · ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const sentenceCase = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getUserName = (value?: string | UserData): string => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return getPartyDisplayName(value, value.email);
};

type DetailItem = { label: string; value: string };

export default function AdminProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: authData } = useAppSelector((state) => state.auth);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const token = authData?.tokens?.accessToken;

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useProductQuery(id, { enabled: Boolean(id && token) });
  const message = error instanceof Error ? error.message : "";
  const reviewVisibility = useReviewProductVisibilityMutation();

  // `category` is populated to `{ _id, name }` on read; fall back to resolving a
  // bare id against the shared category list for older/unpopulated responses.
  const { data: categories } = useCategoriesQuery(
    {},
    { enabled: Boolean(token) },
  );
  const categoryName = useMemo(() => {
    const name = getProductCategoryName(product);
    if (name) return name;
    const categoryId = getProductCategoryId(product);
    if (!categoryId) return "-";
    return categories?.find((c) => c._id === categoryId)?.name ?? categoryId;
  }, [categories, product]);

  const statusMeta = product ? getListingStatusMeta(product.status) : null;
  // An approved (live) product can carry a pending edit that must be reviewed
  // before it goes live. The same visibility approve/reject endpoint governs it.
  const hasPendingRevision = Boolean(product?.hasPendingRevision);
  const canReview = product?.status === "pending" || hasPendingRevision;

  const specificationItems = getProductSpecificationItems(product);

  const details = useMemo<DetailItem[]>(() => {
    if (!product) return [];
    const subCategory = getProductSubcategoryName(product);
    const items: DetailItem[] = [
      { label: "Category", value: categoryName },
      { label: "Sub-category", value: subCategory },
      { label: "Condition", value: sentenceCase(product.condition) },
      { label: "Pricing type", value: getPricingModeLabel(product) },
      { label: "Availability", value: getProductAvailabilityLabel(product) },
      { label: "Unit of measure", value: product.unit_of_measure ?? "" },
      {
        label: "Manufacturing country",
        value: product.manufacturing_country ?? "",
      },
      { label: "SKU", value: product.sku ?? "" },
      { label: "Brand / OEM", value: product.brand_oem ?? "" },
      { label: "Delivery time", value: product.delivery_time ?? "" },
      {
        label: "Installation",
        value:
          product.requiresInstallation === true
            ? product.installation_time
              ? `Required · ${product.installation_time}`
              : "Required"
            : product.requiresInstallation === false
              ? "Not required"
              : "",
      },
      { label: "Return policy", value: product.return_policy ?? "" },
    ];
    return items.filter((item) => item.value && item.value !== "-");
  }, [product, categoryName]);

  const handleApprove = async () => {
    if (!product || !token) return;
    setSubmitting(true);
    setActionError("");

    try {
      await reviewVisibility.mutateAsync({
        id: product._id,
        dto: { action: "approve" },
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setSubmitting(false);
      setShowRejectForm(false);
    }
  };

  const handleReject = async () => {
    if (!product || !token) return;
    setSubmitting(true);
    setActionError("");

    try {
      await reviewVisibility.mutateAsync({
        id: product._id,
        dto: { action: "reject", rejectionReason: rejectReason.trim() },
      });
      setRejectReason("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setSubmitting(false);
      setShowRejectForm(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header
          title="Products & Listings"
          description="View all products and listing requests"
        />
        <div className="p-6">
          <div className="card flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gray3" size={28} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div>
        <Header
          title="Products & Listings"
          description="View all products and listing requests"
        />
        <div className="p-6">
          <div className="card py-16 text-center">
            <p className="mb-2 text-danger">Unable to load product.</p>
            <p className="text-gray3">{message || "Product not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  const certifications = (product.certifications ?? []).filter((c) => c?.url);

  return (
    <div>
      <Header
        title="Products & Listings"
        description="View all products and listing requests"
      />

      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray2 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Go Back
        </Link>

        {/* Review action bar */}
        <section className="rounded-2xl border border-gray5 bg-white p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F1FF]">
                <Package size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray1">
                  {getUserName(product.createdBy)}
                </p>
                <p className="text-xs text-gray3">
                  Submitted {formatDate(product.submittedAt ?? product.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {statusMeta && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                    hasPendingRevision
                      ? "bg-[#FFF1CC] text-[#9A6700]"
                      : statusMeta.className
                  }`}
                >
                  {hasPendingRevision ? "Edit awaiting review" : statusMeta.label}
                </span>
              )}
              {canReview && (
                <div className="flex gap-2">
                  <Button
                    title={
                      submitting
                        ? "Processing..."
                        : hasPendingRevision
                          ? "Approve edit"
                          : "Approve"
                    }
                    size="sm"
                    onClick={handleApprove}
                    disabled={submitting}
                    className="h-9 w-auto rounded-lg px-4"
                  />
                  <Button
                    title="Reject"
                    variant="secondaryLight"
                    size="sm"
                    className="h-9 w-auto rounded-lg border-danger! px-4 text-danger!"
                    onClick={() => setShowRejectForm((open) => !open)}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </div>

          {showRejectForm && (
            <div className="mt-4 space-y-3 rounded-xl border border-danger/20 bg-red-50 p-4">
              <Textarea
                label="Rejection reason"
                placeholder={
                  hasPendingRevision
                    ? "Explain why this edit should not go live. The current listing stays as-is."
                    : "Explain why this listing should remain hidden from the public website..."
                }
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="min-h-[100px]"
              />
              <Button
                title={submitting ? "Processing..." : "Confirm Rejection"}
                className="bg-danger! hover:bg-danger/90!"
                disabled={!rejectReason.trim() || submitting}
                onClick={handleReject}
              />
            </div>
          )}

          {actionError && (
            <p className="mt-3 text-sm text-danger">{actionError}</p>
          )}
        </section>

        {/* Status / lifecycle banner */}
        {hasPendingRevision ? (
          <div className="flex items-start gap-2 rounded-2xl border border-[#FDE8C8] bg-[#FFF8EE] p-4 text-sm text-[#8A5A00]">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>
              The distributor edited this live listing. Approve to publish the
              changes, or reject to keep the current listing unchanged.
              {product.pendingRevision?.submittedAt
                ? ` Submitted ${formatDate(product.pendingRevision.submittedAt)}.`
                : ""}
            </span>
          </div>
        ) : product.status === "pending" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-[#FDE8C8] bg-[#FFF8EE] p-4 text-sm text-[#8A5A00]">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>This submitted listing is awaiting admin review.</span>
          </div>
        ) : product.status === "approved" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-[#C8F2D8] bg-[#F1FFF6] p-4 text-sm text-[#2A7A4B]">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>
              This listing is approved and visible on the public website.
            </span>
          </div>
        ) : product.status === "rejected" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-danger/20 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              This listing was rejected and remains hidden from the public
              website.
              {product.visibilityRejectionReason
                ? ` Reason: ${product.visibilityRejectionReason}`
                : ""}
            </span>
          </div>
        ) : null}

        {/* Product overview */}
        <section className="space-y-6 rounded-2xl border border-gray5 bg-white p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <ProductImageGallery
              mainImage={getProductDefaultImageUrl(product)}
              thumbnails={getProductImageUrls(product)}
              title={product.name}
            />

            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold leading-snug text-gray1">
                  {product.name}
                </h1>
                <span className="inline-flex rounded-md bg-[#E8F3FF] px-3 py-1.5 text-sm font-medium text-primary">
                  {getProductAvailabilityLabel(product)}
                </span>
                <p className="text-3xl font-bold text-[#12355B]">
                  {formatMoney(product.pricePerUnit || 0)}
                </p>
              </div>

              {product.oemApprovalStatus && (
                <div className="flex items-center gap-2 rounded-xl border border-gray5 bg-[#F9FBFD] px-3 py-2.5 text-sm">
                  <ShieldCheck size={16} className="shrink-0 text-primary" />
                  <span className="text-gray2">
                    OEM badge:{" "}
                    <span className="font-medium text-gray1">
                      {product.oemApprovalStatus === "approved"
                        ? "Verified"
                        : product.oemApprovalStatus === "pending"
                          ? "Awaiting review"
                          : product.oemApprovalStatus === "rejected"
                            ? "Rejected"
                            : "Not requested"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray5 pt-5">
            <h2 className="text-base font-semibold text-gray1">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray2">
              {product.description || "No description provided for this product."}
            </p>
          </div>

          {/* Details grid */}
          {details.length > 0 && (
            <div className="border-t border-gray5 pt-5">
              <h2 className="text-base font-semibold text-gray1">
                Product Details
              </h2>
              <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {details.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between gap-4 border-b border-gray5/60 pb-2 text-sm"
                  >
                    <dt className="text-gray3">{item.label}</dt>
                    <dd className="text-right font-medium text-gray1">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Specifications */}
          <div className="border-t border-gray5 pt-5">
            <h2 className="text-base font-semibold text-gray1">
              Key Specifications
            </h2>
            {specificationItems.length > 0 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {specificationItems.map((spec, index) => (
                  <li
                    key={`${spec.label}-${index}`}
                    className="flex justify-between gap-4 rounded-lg bg-[#F8F8FA] px-3 py-2 text-sm"
                  >
                    <span className="text-gray3">{spec.label}</span>
                    <span className="text-right font-medium text-gray1">
                      {spec.value || "-"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray3">
                No key specifications provided.
              </p>
            )}
          </div>

          {/* Attachments & links */}
          {(certifications.length > 0 ||
            product.brochure?.url ||
            product.video_link) && (
            <div className="border-t border-gray5 pt-5">
              <h2 className="text-base font-semibold text-gray1">
                Attachments &amp; Links
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.video_link && (
                  <a
                    href={product.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray5 bg-white px-3 py-2 text-sm text-gray2 hover:border-primary hover:text-primary"
                  >
                    <ExternalLink size={14} />
                    Video
                  </a>
                )}
                {product.brochure?.url && (
                  <a
                    href={product.brochure.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray5 bg-white px-3 py-2 text-sm text-gray2 hover:border-primary hover:text-primary"
                  >
                    <FileText size={14} />
                    {product.brochure.name || "Brochure"}
                  </a>
                )}
                {certifications.map((cert, index) => (
                  <a
                    key={`${cert.url}-${index}`}
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray5 bg-white px-3 py-2 text-sm text-gray2 hover:border-primary hover:text-primary"
                  >
                    <FileText size={14} />
                    {cert.name || `Certification ${index + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
