"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";

import Header from "../../../component/header";
import { Button, PopUp } from "@/components/base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  useProductQuery,
  useReviewProductMutation,
} from "@/hooks/queries/products";
import {
  getProductAvailabilityLabel,
  getProductSpecificationItems,
} from "@/utils/productDisplay";

import {
  formatCurrency,
  getDistributorAvatar,
  getDistributorName,
  getOemStatusMeta,
  getProductHeroImage,
  normalizeOemStatus,
} from "../../oem-ui";

export default function OemListingRequestDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: authData } = useAppSelector((state) => state.auth);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showApproveSuccess, setShowApproveSuccess] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const token = authData?.tokens?.accessToken ?? "";

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useProductQuery(id, { enabled: Boolean(id && token) });
  const message = error instanceof Error ? error.message : "";
  const reviewProduct = useReviewProductMutation();

  const listingStatus = normalizeOemStatus(product?.oemApprovalStatus ?? "pending");
  const listingStatusMeta = getOemStatusMeta(listingStatus);
  const specificationRows = useMemo(() => getProductSpecificationItems(product), [product]);
  const heroImage = getProductHeroImage(product);
  const canReview = Boolean(product) && listingStatus === "pending";

  const imageSlots = useMemo(() => {
    const imgs = product?.images?.length ? product.images : [];
    return Array.from({ length: 4 }, (_, index) => imgs[index] ?? null);
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?._id]);

  const displayHero =
    imageSlots[activeImageIndex] ?? heroImage ?? imageSlots.find(Boolean) ?? null;

  const handleApprove = async () => {
    if (!product) {
      return;
    }

    setActionError("");
    setReviewLoading(true);

    try {
      await reviewProduct.mutateAsync({
        id: product._id,
        dto: { action: "approve" },
      });
      setShowApproveSuccess(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    if (!product || !rejectReason.trim()) {
      return;
    }

    setActionError("");
    setReviewLoading(true);

    try {
      await reviewProduct.mutateAsync({
        id: product._id,
        dto: {
          action: "reject",
          rejectionReason: rejectReason.trim(),
        },
      });
      setShowRejectForm(false);
      setRejectReason("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setReviewLoading(false);
    }
  };

  if (isLoading && !product) {
    return (
      <div>
        <Header
          title="Listing Request"
          description="View all, approve or deny all product listing request"
        />
        <div className="bg-[#F5F7FB] p-6 text-sm text-gray3">Loading listing request...</div>
      </div>
    );
  }

  if (!product || isError) {
    return (
      <div>
        <Header
          title="Listing Request"
          description="View all, approve or deny all product listing request"
        />
        <div className="bg-[#F5F7FB] p-6 text-sm text-danger">
          {message || "The selected listing request could not be loaded."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Listing Request"
        description="View all, approve or deny all product listing request"
      />

      <div className="space-y-4 bg-[#F9FAFB] p-4 md:p-6">
        <Link
          href="/dashboard/oem/requests"
          className="inline-flex items-center gap-2 text-[18px] font-normal leading-8 text-[#111827]"
        >
          <ArrowLeft size={24} strokeWidth={1.75} aria-hidden />
          Go Back
        </Link>

        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-[#DDE0E5] bg-white px-5 py-6 shadow-sm md:flex-row md:items-center md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-11 shrink-0 border border-[#E8ECF4] bg-[#EDF2FF]">
              <AvatarImage
                src={getDistributorAvatar(product.createdBy)}
                alt={getDistributorName(product.createdBy)}
              />
              <AvatarFallback className="bg-[#EDF2FF] text-sm font-semibold text-primary">
                {getDistributorName(product.createdBy)
                  .split(" ")
                  .map((p) => p.charAt(0))
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-base font-semibold leading-8 text-[#111827] md:text-xl">
              {getDistributorName(product.createdBy)}
            </h2>
          </div>

          {/* Verification row — same pattern as Figma 166:8778: light outer tint + stronger inner badge per status */}
          <div className="w-full shrink-0 md:w-auto md:max-w-[371px]">
            <div
              className={`flex items-center justify-center gap-10 rounded-2xl border px-8 py-5 ${
                listingStatus === "pending"
                  ? "border-[#FFE079] bg-[#FFF6D9]"
                  : listingStatus === "approved"
                    ? "border-[#7FE7A2] bg-[#E7FFEF]"
                    : "border-[#FCA5A5] bg-[#FEE2E2]"
              }`}
            >
              <span className="whitespace-nowrap text-lg font-medium leading-6 text-[#272B36]">
                Verification status
              </span>
              {listingStatus === "pending" ? (
                <div className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#FFC000] px-[18px] py-[11px]">
                  <span
                    className="flex size-[18px] items-center justify-center rounded bg-white"
                    aria-hidden
                  >
                    <Check className="size-3 text-[#FFC000]" strokeWidth={3} />
                  </span>
                  <span className="whitespace-nowrap text-lg font-normal leading-7 text-white">
                    {listingStatusMeta.label}
                  </span>
                </div>
              ) : listingStatus === "approved" ? (
                <div className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#13A83B] px-[18px] py-[11px]">
                  <span
                    className="flex size-[18px] items-center justify-center rounded bg-white"
                    aria-hidden
                  >
                    <Check className="size-3 text-[#13A83B]" strokeWidth={3} />
                  </span>
                  <span className="whitespace-nowrap text-lg font-normal leading-7 text-white">
                    {listingStatusMeta.label}
                  </span>
                </div>
              ) : (
                <div className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#DC2626] px-[18px] py-[11px]">
                  <span
                    className="flex size-[18px] items-center justify-center rounded bg-white"
                    aria-hidden
                  >
                    <X className="size-3 text-[#DC2626]" strokeWidth={3} />
                  </span>
                  <span className="whitespace-nowrap text-lg font-normal leading-7 text-white">
                    {listingStatusMeta.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white shadow-sm">
          {/*
            Figma 166:8738: one top band — [thumbs + hero] (~502px) | gutter | copy (~585px max), all items-start.
            Key Specifications is a separate full-width block below the horizontal rule (not inline with the gallery).
          */}
          <div className="grid gap-10 p-5 md:gap-10 md:p-6 lg:grid-cols-[502px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:pt-8 xl:gap-8">
            <div className="flex w-full shrink-0 items-start gap-3 sm:gap-4 lg:w-[502px] lg:min-w-0 lg:max-w-[502px]">
              <div className="flex w-[72px] shrink-0 flex-col gap-2 sm:w-[87px]">
                {imageSlots.map((image, index) => (
                  <button
                    key={`thumbnail-${index}`}
                    type="button"
                    onClick={() => image && setActiveImageIndex(index)}
                    disabled={!image}
                    className={`aspect-square w-full overflow-hidden rounded-xl border bg-[#F7F9FC] transition ${
                      activeImageIndex === index && image
                        ? "border-[#0669D9] ring-2 ring-[#0669D9]/25"
                        : "border-[#DDE0E5]"
                    } ${image ? "cursor-pointer" : "cursor-default opacity-40"}`}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="aspect-square w-full max-w-[398px] shrink-0 overflow-hidden rounded-2xl border border-[#DDE0E5] bg-[#F7F9FC] lg:h-[398px] lg:w-[398px] lg:max-w-[398px]">
                {displayHero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayHero.url}
                    alt={product.name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-gray3 lg:min-h-[398px]">
                    No image available
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:flex lg:min-h-[398px] lg:flex-col lg:pt-0">
              <h3 className="text-[28px] font-semibold leading-10 text-[#111827]">{product.name}</h3>
              <div className="mt-3 inline-flex w-fit rounded-2xl bg-[#C7EEFF] px-5 py-3 text-xl font-medium text-[#03265C]">
                {getProductAvailabilityLabel(product)}
              </div>
              <p className="mt-4 text-[32px] font-semibold leading-10 text-[#03265C]">
                {formatCurrency(product.pricePerUnit)}
              </p>

              <div className="mt-6 max-w-[760px]">
                <h4 className="text-2xl font-medium leading-9 text-[#111827]">Description</h4>
                <p className="mt-2 text-lg font-normal leading-7 text-[#4B5563]">
                  {product.description || "Product description is not available yet."}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#DDE0E5] px-5 pb-8 pt-10 md:px-6 md:pt-12">
            <h4 className="text-[32px] font-semibold leading-[48px] text-[#111827]">Key Specifications</h4>
            {specificationRows.length === 0 ? (
              <p className="mt-5 text-base text-[#6B7280]">No specification has been added yet.</p>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-[#DDE0E5]">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="border-b border-r border-[#DDE0E5] bg-[#EEF0F4] px-4 py-3 text-2xl font-semibold text-[#4B5563]">
                        Specifications
                      </th>
                      <th className="border-b border-[#DDE0E5] bg-[#EEF0F4] px-4 py-3 text-2xl font-semibold text-[#4B5563]">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {specificationRows.map((row, index) => (
                      <tr
                        key={`${row.label}-${row.value}-${index}`}
                        className={index % 2 === 0 ? "bg-[#F8F8FA]" : "bg-white"}
                      >
                        <td className="border-b border-r border-[#DDE0E5] px-4 py-3 align-top text-xl font-medium text-[#4B5563]">
                          {row.label}
                        </td>
                        <td className="border-b border-[#DDE0E5] px-4 py-3 align-top text-xl font-medium text-[#4B5563]">
                          {row.value || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-[#DDE0E5] px-5 py-8 md:px-6">
            <div className="flex max-w-[664px] flex-col gap-6 sm:flex-row sm:gap-6">
              <Link href={`/dashboard/oem/requests/${product._id}/edit`} className="w-full min-w-0 sm:max-w-[320px] sm:flex-1">
                <Button
                  title="Edit Product"
                  variant="primary"
                  iconLeft={<Pencil className="size-6" strokeWidth={1.75} aria-hidden />}
                  className="h-16 rounded-[14px] border-[#0669D9] bg-[#0669D9] text-lg font-normal text-white hover:bg-[#0558B8]"
                />
              </Link>
              {canReview ? (
                <div className="w-full min-w-0 sm:max-w-[320px] sm:flex-1">
                  <Button
                    title={reviewLoading ? "Processing..." : "Approve Product"}
                    iconLeft={<Check className="size-6" strokeWidth={1.75} aria-hidden />}
                    className="h-16 rounded-[14px] border-[#13A83B] bg-[#13A83B] text-lg font-normal text-white hover:bg-[#0F8A31]"
                    onClick={handleApprove}
                    disabled={reviewLoading}
                  />
                </div>
              ) : null}
            </div>

            {canReview ? (
              <div className="mt-4 max-w-[220px]">
                <Button
                  title="Reject listing"
                  variant="primaryLight"
                  className="rounded-2xl !border-danger !text-danger"
                  onClick={() => setShowRejectForm((open) => !open)}
                  disabled={reviewLoading}
                />
              </div>
            ) : null}

            {showRejectForm && canReview ? (
              <div className="mt-5 max-w-[520px] space-y-3 rounded-[20px] border border-[#F4D3D3] bg-[#FFF8F8] p-4">
                <label htmlFor="oem-reject-reason" className="text-sm font-medium text-gray1">
                  Rejection reason
                </label>
                <textarea
                  id="oem-reject-reason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Explain why this listing should be rejected..."
                  className="w-full rounded-2xl border border-gray5 px-4 py-3 text-sm text-gray1 focus:outline-none focus:border-gray2"
                />
                <div className="max-w-[220px]">
                  <Button
                    title={reviewLoading ? "Processing..." : "Confirm rejection"}
                    className="rounded-2xl bg-danger !border-danger hover:!bg-danger/90"
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || reviewLoading}
                  />
                </div>
              </div>
            ) : null}

            {listingStatus === "rejected" ? (
              <p className="mt-4 text-sm font-medium text-danger">
                This product listing has been rejected.
              </p>
            ) : null}
            {actionError ? <p className="mt-4 text-sm text-danger">{actionError}</p> : null}
          </div>
        </section>
      </div>

      <PopUp
        open={showApproveSuccess}
        type="success"
        title="Congratulations"
        description="You have approved this product listing request"
        primaryButtonText="Continue"
        onClose={() => setShowApproveSuccess(false)}
      />
    </div>
  );
}
