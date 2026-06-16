"use client";

import Image from "next/image";
import { CheckCircle2, Star, Wrench } from "lucide-react";

import { PublicProfileData } from "@/types/user";

interface EngineerProfileCardProps {
  engineer: PublicProfileData;
  mode: "profile" | "request";
  onRequest: () => void;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "orange" | "gray";
}) {
  const className = {
    blue: "border-[#d7e8fb] bg-[#eef6ff] text-[#3982dd]",
    orange: "border-[#ffd6b2] bg-[#fff7ef] text-[#ff8b2c]",
    gray: "border-[#dde4ee] bg-white text-[#7e8ca3]",
  }[tone];

  return (
    <span className={`rounded-[10px] border px-3 py-1 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function DetailGroup({
  label,
  items,
  tone,
  max = items.length,
  showMoreTone = "blue",
}: {
  label: string;
  items: string[];
  tone: "blue" | "orange" | "gray";
  max?: number;
  showMoreTone?: "blue" | "orange" | "gray";
}) {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, max);
  const extraCount = items.length - visibleItems.length;

  return (
    <div className="min-w-0 flex-1 md:border-r md:border-[#e4ebf4] md:pr-6 last:md:border-r-0 last:md:pr-0">
      <p className="text-[11px] font-medium text-[#8391a6]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibleItems.map((item) => (
          <Chip key={`${label}-${item}`} tone={tone}>
            {item}
          </Chip>
        ))}
        {extraCount > 0 && <Chip tone={showMoreTone}>+ {extraCount} more</Chip>}
      </div>
    </div>
  );
}

function AboutCard({ bio }: { bio?: string }) {
  return (
    <div className="rounded-[18px] border border-[#e9eff6] bg-white px-5 py-4 md:px-6">
      <h2 className="text-[15px] font-semibold text-[#183353]">About Engineer</h2>
      <p className="mt-2 text-[13px] leading-6 text-[#627186]">
        {bio?.trim() || "This engineer has not added a public profile summary yet."}
      </p>
    </div>
  );
}

export default function EngineerProfileCard({
  engineer,
  mode,
  onRequest,
}: EngineerProfileCardProps) {
  const fullName = `${engineer.firstName} ${engineer.lastName}`.trim();
  const ratingLabel =
    typeof engineer.rating === "number" ? engineer.rating.toFixed(1) : "No rating";
  const ratingContextLabel =
    typeof engineer.rating === "number"
      ? typeof engineer.reviewCount === "number" && engineer.reviewCount > 0
        ? `${engineer.reviewCount} buyer review${engineer.reviewCount === 1 ? "" : "s"}`
        : "Marketplace rating"
      : null;
  const experienceLabel =
    typeof engineer.experienceYears === "number"
      ? `${engineer.experienceYears} years experience`
      : "Experience not stated";

  return (
    <section className="relative -mt-[42px] pb-1 md:-mt-[74px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="mx-auto flex h-[128px] w-[128px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[7px] border-white bg-[#dfe7f1] shadow-[0_16px_34px_rgba(15,37,79,0.10)] md:mx-0 md:h-[162px] md:w-[162px] md:border-[8px]">
          {engineer.displayPhoto?.url ? (
            <Image
              src={engineer.displayPhoto.url}
              alt={fullName}
              width={162}
              height={162}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[34px] font-semibold text-[#5f6f86] md:text-[40px]">
              {getInitials(engineer.firstName, engineer.lastName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 md:pt-[94px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#5d6d84]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7efd5] bg-[#f5fbf4] px-3 py-1 text-[#56b35d]">
              <CheckCircle2 size={14} className="shrink-0" />
              Verified engineer
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#223552]">
              <Star size={14} className="fill-[#ffbe17] text-[#ffbe17]" />
              {ratingLabel}
            </span>
            {ratingContextLabel && <span className="text-[#7c8ba1]">{ratingContextLabel}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Wrench size={14} className="text-[#7f8da1]" />
              {experienceLabel}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:gap-5">
            <DetailGroup
              label="Specializations"
              items={engineer.specializations ?? []}
              tone="blue"
              max={3}
            />
            <DetailGroup
              label="OEM tags"
              items={engineer.oemTags ?? []}
              tone="orange"
              max={2}
            />
            <DetailGroup
              label="Equipment types"
              items={engineer.equipmentTypes ?? []}
              tone="gray"
              max={2}
            />
          </div>
        </div>
      </div>

      {mode === "profile" && (
        <>
          <div className="mt-8">
            <AboutCard bio={engineer.bio} />
          </div>

          <button
            type="button"
            onClick={onRequest}
            className="mt-8 inline-flex min-h-11 w-full max-w-[248px] items-center justify-center rounded-[10px] bg-[#0669d9] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0459b9]"
          >
            Request The Engineer
          </button>
        </>
      )}
    </section>
  );
}
