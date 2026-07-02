"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Loader2,
  Package,
  Tag,
  XCircle,
} from "lucide-react";
import Header from "../../../component/header";
import { Button, Textarea } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  useProductQuery,
  useReviewProductVisibilityMutation,
} from "@/hooks/queries/products";
import type { UserData } from "@/types/user";
import { getListingStatusMeta } from "@/utils/productStatus";

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
  return `${date.toLocaleDateString("en-GB")} - ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const getUserName = (value?: string | UserData): string => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || value.email;
};

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

  const statusMeta = product ? getListingStatusMeta(product.status) : null;
  const defaultImage = product?.images.find((image) => image.isDefault)?.url;

  const keySpecifications = useMemo(
    () => {
      const fromText =
        product?.keySpecifications
        ?.split("; ")
        .filter(Boolean)
        .map((entry) => {
          const [label, value] = entry.split(": ");
          return { label: label ?? entry, value: value ?? "" };
        }) ?? [];

      const fromAttributes = [
        ...(product?.key_attributes?.industry_specific ?? []),
        ...(product?.key_attributes?.other ?? []),
      ].map((item) => ({
        label: item.spec ?? item.label ?? "Specification",
        value: item.detail ?? item.value ?? "",
      }));

      const merged = [...fromText, ...fromAttributes].filter(
        (item, index, list) =>
          item.label &&
          list.findIndex((candidate) => candidate.label === item.label) === index
      );

      return merged.length > 0
        ? merged
        : [
            { label: "Category", value: product?.category ?? "-" },
            { label: "Condition", value: product?.condition ?? "-" },
            { label: "Unit of measure", value: product?.unit_of_measure ?? "-" },
            { label: "Delivery time", value: product?.delivery_time ?? "-" },
          ];
    },
    [product]
  );

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

  return (
    <div>
      <Header
        title="Products & Listings"
        description="View all products and listing requests"
      />

      <div className="space-y-6 p-5 lg:p-6">
        <Link
          href="/dashboard/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={14} />
          Go Back
        </Link>

        <section className="rounded-2xl border border-gray5 bg-white p-4 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E7F1FF]">
                <Package size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-8 text-gray1">
                  {getUserName(product.createdBy)}
                </h2>
                <p className="text-sm text-gray3">
                  Submitted {formatDate(product.submittedAt ?? product.createdAt)}
                </p>
              </div>
            </div>

            {statusMeta && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#FFE079] bg-[#FFF6D9] p-4 sm:flex-row sm:items-center sm:justify-between lg:min-w-[360px]">
                <div className="flex items-center justify-between gap-4 sm:flex-1">
                  <p className="text-base font-medium text-[#272B36]">Product status</p>
                  <span
                    className={`inline-flex rounded-lg px-4 py-2 text-sm font-medium ${
                      product.status === "pending"
                        ? "bg-[#FFC000] text-white"
                        : statusMeta.className
                    }`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
                {product.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      title={submitting ? "Processing..." : "Approve"}
                      size="sm"
                      onClick={handleApprove}
                      disabled={submitting}
                      className="h-10 w-auto rounded-lg px-4"
                    />
                    <Button
                      title="Reject"
                      variant="secondaryLight"
                      size="sm"
                      className="h-10 w-auto rounded-lg border-danger! px-4 text-danger!"
                      onClick={() => setShowRejectForm((open) => !open)}
                      disabled={submitting}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray5 bg-white p-5 lg:p-10">
          {showRejectForm ? (
            <div className="mb-8 space-y-3 rounded-2xl border border-danger/20 bg-red-50 p-4">
              <Textarea
                label="Rejection reason"
                placeholder="Explain why this listing should remain hidden from the public website..."
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="min-h-[120px]"
              />
              <Button
                title={submitting ? "Processing..." : "Confirm Rejection"}
                className="bg-danger! hover:bg-danger/90!"
                disabled={!rejectReason.trim() || submitting}
                onClick={handleReject}
              />
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[minmax(0,556px)_minmax(0,1fr)]">
            <div className="relative flex aspect-[556/414] min-h-[238px] items-center justify-center overflow-hidden rounded-lg border border-gray5 bg-gray7">
              {defaultImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={defaultImage}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <Package size={52} className="text-gray3" />
              )}
              <button
                type="button"
                aria-label="Previous product image"
                className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray1 shadow"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Next product image"
                className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray1 shadow"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-[28px] font-semibold leading-[1.35] text-gray1 lg:text-[32px] lg:leading-[48px]">
                {product.name}
              </h3>
              <div className="mt-4 inline-flex w-fit rounded-lg bg-[#C7EEFF] px-5 py-3 text-xl font-medium leading-8 text-primary lg:text-2xl lg:leading-10">
                {product.quantityAvailable ?? 0} In stock
              </div>
              <p className="mt-6 text-[34px] font-semibold leading-[1.25] text-[#03265C] lg:text-[40px]">
                {formatMoney(product.pricePerUnit)}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-gray3">
                <span className="inline-flex items-center gap-1">
                  <Tag size={14} />
                  {product.category}
                </span>
                {product.sub_category ? (
                  <span className="rounded-full bg-gray7 px-3 py-1">
                    {product.sub_category}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold leading-10 text-gray1">
                Description
              </h3>
              <button
                type="button"
                aria-label="Edit description"
                className="flex size-12 items-center justify-center rounded-xl bg-gray7 text-gray2"
              >
                <Edit3 size={18} />
              </button>
            </div>
            <p className="mt-3 max-w-[1080px] text-base leading-8 text-gray2 lg:text-xl">
              {product.description || "No description provided for this product."}
            </p>
          </section>

          <section className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold leading-10 text-gray1">
                Key Specifications
              </h3>
              <button
                type="button"
                aria-label="Edit key specifications"
                className="flex size-12 items-center justify-center rounded-xl bg-gray7 text-gray2"
              >
                <Edit3 size={18} />
              </button>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray5">
              <table className="w-full min-w-[620px] table-fixed text-left">
                <thead>
                  <tr>
                    <th className="w-1/2 border-b border-r border-gray5 bg-[#EEF0F4] px-5 py-5 text-base font-semibold text-gray2 lg:text-2xl">
                      Specifications
                    </th>
                    <th className="border-b border-gray5 bg-[#F0F1F6] px-5 py-5 text-base font-semibold text-gray2 lg:text-2xl">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keySpecifications.map((item, index) => (
                    <tr
                      key={`${item.label}-${index}`}
                      className={index % 2 === 0 ? "bg-[#F8F8FA]" : "bg-[#FEFDFE]"}
                    >
                      <th className="w-1/2 border-r border-gray5 px-5 py-5 text-base font-medium text-gray2 lg:text-2xl">
                        {item.label}
                      </th>
                      <td className="px-5 py-5 text-base font-medium text-gray2 lg:text-2xl">
                        {item.value || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 space-y-3">
            {product.status === "approved" && (
              <div className="flex items-start gap-2 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>
                  This listing has been approved and is now visible on the public
                  website.
                </span>
              </div>
            )}
            {product.status === "rejected" && (
              <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  This listing has been rejected and remains hidden from the public
                  website.
                  {product.visibilityRejectionReason
                    ? ` Reason: ${product.visibilityRejectionReason}`
                    : ""}
                </span>
              </div>
            )}
            {product.status === "pending" && (
              <div className="flex items-start gap-2 rounded-2xl bg-[#FFF5DB] p-4 text-sm text-[#9A6700]">
                <Clock size={16} className="mt-0.5 shrink-0" />
                <span>This submitted listing is awaiting admin review.</span>
              </div>
            )}
            {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
