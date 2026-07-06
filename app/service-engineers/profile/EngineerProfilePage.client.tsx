"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, Home, MessageSquareQuote, Star } from "lucide-react";

import Banner from "@/components/features/public/Banner";
import { Spinner } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { PublicLayout } from "@/components/layout";
import { type ReviewData } from "@/services/reviewService";
import { useEngineerReviewsQuery } from "@/hooks/queries/reviews";
import { fetchPublicProfileById } from "@/store/slices/user-slice";

import EngineerProfileCard from "./EngineerProfileCard";
import ServiceJobRequestForm from "./ServiceJobRequestForm";

function EngineerProfileHero({ title }: { title: string }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,28,44,0.80)_0%,rgba(32,53,79,0.60)_45%,rgba(32,53,79,0.32)_100%)]" />

      <div className="relative mx-auto max-w-[1220px] px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pb-[84px] lg:pt-[34px]">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] font-medium">
          <Link
            href="/"
            className="inline-flex items-center text-[#fe8a1f] transition hover:text-[#ff9b43]"
          >
            <Home size={13} />
          </Link>
          <ChevronRight size={14} className="text-[#c7d0dd]" />
          <Link
            href="/service-engineers"
            className="text-[#fe8a1f] transition hover:text-[#ff9b43]"
          >
            Service engineer
          </Link>
          <ChevronRight size={14} className="text-[#c7d0dd]" />
          <span className="truncate text-[#d8e0ea]">{title}</span>
        </nav>

        <h1 className="mt-3 text-[36px] font-extrabold tracking-[-0.04em] text-white md:text-[54px]">
          {title}
        </h1>
      </div>
    </section>
  );
}

function getReviewBuyerName(review: ReviewData): string {
  if (typeof review.buyer === "string") {
    return "Verified buyer";
  }

  const fullName = [review.buyer.firstName, review.buyer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Verified buyer";
}

function getReviewBuyerInitials(review: ReviewData): string {
  if (typeof review.buyer === "string") {
    return "VB";
  }

  const initials = `${review.buyer.firstName?.charAt(0) ?? ""}${review.buyer.lastName?.charAt(0) ?? ""}`;
  return initials.toUpperCase() || "VB";
}

function getReviewBuyerPhoto(review: ReviewData): string | undefined {
  return typeof review.buyer === "string" ? undefined : review.buyer.displayPhoto?.url;
}

function getServiceRequestSummary(review: ReviewData): string | null {
  if (typeof review.serviceRequest === "string") {
    return null;
  }

  const details = [review.serviceRequest.jobType, review.serviceRequest.equipmentName].filter(Boolean);
  return details.length > 0 ? details.join(" - ") : null;
}

function formatReviewDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        return (
          <Star
            key={starNumber}
            size={14}
            className={
              starNumber <= Math.round(rating)
                ? "fill-[#ffbe17] text-[#ffbe17]"
                : "text-[#d8e1ec]"
            }
          />
        );
      })}
    </div>
  );
}

function BuyerReviewsSection({
  rating,
  reviewCount,
  reviews,
  loading,
  error,
}: {
  rating?: number;
  reviewCount?: number;
  reviews: ReviewData[];
  loading: boolean;
  error: string | null;
}) {
  const hasRating = typeof rating === "number";
  const hasBuyerReviews = typeof reviewCount === "number" && reviewCount > 0;
  const summaryText = hasRating
    ? hasBuyerReviews
      ? `Public profile summary: ${rating.toFixed(1)} from ${reviewCount} buyer review${
          reviewCount === 1 ? "" : "s"
        }.`
      : `Public profile summary: ${rating.toFixed(1)} marketplace rating.`
    : "Public profile summary is not available yet.";

  return (
    <section className="mt-6 rounded-[24px] border border-[#e6edf5] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,37,79,0.05)] md:px-6">
      <div className="flex flex-col gap-3 border-b border-[#eef3f8] pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[#1d3659]">
            <MessageSquareQuote size={18} className="text-[#0669d9]" />
            <h2 className="text-[18px] font-semibold">Buyer Reviews</h2>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#66758a]">{summaryText}</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner showLoadingText />
        </div>
      )}

      {!loading && error && (
        <div className="mt-5 rounded-[18px] border border-[#fde5bf] bg-[#fff8eb] px-4 py-4 text-sm text-[#8b5a10]">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>Buyer reviews are temporarily unavailable. The profile summary above is still accurate.</p>
          </div>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="mt-5 rounded-[18px] border border-dashed border-[#d7e5f3] bg-[#f8fbfe] px-5 py-6">
          <p className="text-[15px] font-semibold text-[#1d3659]">No buyer reviews yet</p>
          <p className="mt-2 text-[13px] leading-6 text-[#6d7c92]">
            This engineer can still carry a marketplace rating from seeded or manually curated profile data.
          </p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="mt-5 space-y-4">
          {reviews.map((review) => {
            const reviewDate = formatReviewDate(review.createdAt);
            const serviceSummary = getServiceRequestSummary(review);
            const buyerPhoto = getReviewBuyerPhoto(review);

            return (
              <article
                key={review._id}
                className="rounded-[20px] border border-[#e8eef5] bg-[#fbfdff] px-5 py-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe7f1]">
                      {buyerPhoto ? (
                        <Image
                          src={buyerPhoto}
                          alt={getReviewBuyerName(review)}
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#607188]">
                          {getReviewBuyerInitials(review)}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-[15px] font-semibold text-[#1d3659]">
                        {getReviewBuyerName(review)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#73839a]">
                        <ReviewStars rating={review.rating} />
                        <span>{review.rating.toFixed(1)}</span>
                        {reviewDate && <span>{reviewDate}</span>}
                      </div>
                    </div>
                  </div>

                  {serviceSummary && (
                    <span className="inline-flex rounded-full border border-[#d7e6fb] bg-[#eef6ff] px-3 py-1 text-[12px] font-medium text-[#2d6db8]">
                      {serviceSummary}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-[14px] leading-7 text-[#56677f]">
                  {review.comment?.trim() || "This buyer left a star rating without additional comments."}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function EngineerProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id") || "";
  const mode = searchParams.get("view") === "profile" ? "profile" : "request";

  const { selectedUser, loading, error } = useAppSelector((state) => state.user);

  const reviewsQuery = useEngineerReviewsQuery(id || undefined);
  const reviews: ReviewData[] = reviewsQuery.data ?? [];
  const reviewsLoading = reviewsQuery.isLoading && Boolean(id);
  const reviewsError = reviewsQuery.error
    ? reviewsQuery.error instanceof Error
      ? reviewsQuery.error.message
      : "Failed to fetch buyer reviews"
    : null;

  useEffect(() => {
    if (!id) {
      return;
    }

    dispatch(fetchPublicProfileById(id));
  }, [dispatch, id]);

  const engineerName = selectedUser
    ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
    : "Engineer Name";

  if (!id) {
    return (
      <PublicLayout
        banner={
          <Banner
            title="Engineer Profile"
            breadcrumbs={[
              { label: "Service Engineers", href: "/service-engineers" },
              { label: "Profile" },
            ]}
          />
        }
      >
        <main className="mx-auto max-w-[1220px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[18px] bg-[#fff7f7] px-5 py-4 text-sm text-[#b42318]">
            No engineer ID provided. Please select an engineer from the listing page.
          </div>
        </main>
      </PublicLayout>
    );
  }

  return (
    <>
      {/* Mobile-only: full-screen focused form overlay — no page chrome, matches Figma frame */}
      {mode === "request" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/service-engineers/profile?id=${id}&view=profile`)}
              className="flex items-center justify-center rounded-full p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Back to profile"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base font-semibold text-gray-900">Request For Service Engineer</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ServiceJobRequestForm engineerId={id} />
          </div>
        </div>
      )}
    <PublicLayout
      banner={<EngineerProfileHero title={engineerName} />}
      contentClassName="min-h-screen bg-white"
    >
      <main className="mx-auto max-w-[1220px] px-4 pb-12 pt-0 sm:px-6 lg:px-8 lg:pb-16">
        {loading && (
          <div className="flex justify-center py-24">
            <Spinner showLoadingText />
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-[18px] bg-[#fff7f7] px-5 py-4 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        {!loading && !error && selectedUser && (
          <div className="mx-auto max-w-[1040px]">
            <EngineerProfileCard
              engineer={selectedUser}
              mode={mode}
              onRequest={() => router.push(`/service-engineers/profile?id=${id}&view=request`)}
            />

            {mode === "profile" && (
              <BuyerReviewsSection
                rating={selectedUser.rating}
                reviewCount={selectedUser.reviewCount}
                reviews={reviews}
                loading={reviewsLoading}
                error={reviewsError}
              />
            )}

            {mode === "request" && (
              <>
                {/* Desktop: inline form within the profile page layout (unchanged) */}
                <div className="hidden sm:block mt-6">
                  <ServiceJobRequestForm engineerId={id} />
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </PublicLayout>
    </>
  );
}
