"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Star, Wrench } from "lucide-react";

import { PublicProfileData } from "@/types/user";

interface EngineerCardProps {
  engineer: PublicProfileData;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function TagGroup({
  label,
  items,
  color,
  max = items.length,
}: {
  label: string;
  items: string[];
  color: "blue" | "orange" | "gray";
  max?: number;
}) {
  if (items.length === 0) return null;

  const visible = items.slice(0, max);
  const more = items.length - visible.length;

  const pillClassName = {
    blue: "border-[#d6e7ff] bg-[#eef5ff] text-[#3d84e6]",
    orange: "border-[#ffc795] bg-white text-[#ff8b2c]",
    gray: "border-[#d8e0eb] bg-white text-[#6e7f96]",
  }[color];

  return (
    <div>
      <p className="text-[13px] font-medium text-[#56677f]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visible.map((item) => (
          <span
            key={`${label}-${item}`}
            className={`rounded-[8px] border px-3 py-1 text-[11px] font-medium leading-none ${pillClassName}`}
          >
            {item}
          </span>
        ))}
        {more > 0 && (
          <span className="rounded-[8px] border border-[#d6e7ff] bg-[#eef5ff] px-3 py-1 text-[11px] font-medium leading-none text-[#3d84e6]">
            + {more} more
          </span>
        )}
      </div>
    </div>
  );
}

export default function EngineerCard({ engineer }: EngineerCardProps) {
  const router = useRouter();
  const fullName = `${engineer.firstName} ${engineer.lastName}`.trim();
  const busy = engineer.engineerAvailability === "busy";
  const experience =
    typeof engineer.experienceYears === "number"
      ? `${engineer.experienceYears} years experience`
      : "Experience not stated";
  const ratingLabel =
    typeof engineer.rating === "number"
      ? engineer.rating.toFixed(1)
      : "No rating";
  const summary =
    engineer.bio?.trim() || "Certified biomedical engineer with extensive experience.";

  return (
    <article
      onClick={() =>
        router.push(`/service-engineers/profile?id=${engineer._id}&view=profile`)
      }
      className="flex h-full cursor-pointer flex-col rounded-[16px] border border-[#edf1f7] bg-white px-5 py-6 shadow-[0_6px_18px_rgba(15,37,79,0.04)] transition-shadow hover:shadow-[0_10px_24px_rgba(15,37,79,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe7f1]">
          {engineer.displayPhoto?.url ? (
            <Image
              src={engineer.displayPhoto.url}
              alt={fullName}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[24px] font-medium text-[#70839d]">
              {getInitials(engineer.firstName, engineer.lastName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-semibold leading-tight text-[#203b63]">
            {fullName}
          </h3>

          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#65758c]">
            <MapPin size={13} className="shrink-0 text-[#8794a7]" />
            <span className="truncate">{engineer.address || "Location unavailable"}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#65758c]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#1f2f4a]">
              <Star size={13} className="fill-[#ffbe17] text-[#ffbe17]" />
              {ratingLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wrench size={13} className="text-[#8794a7]" />
              {experience}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 min-h-[44px] text-[14px] leading-[1.75] text-[#4d5d76]">
        {summary}
      </p>

      <div className="mt-5 space-y-5 pb-6">
        <TagGroup
          label="Specializations"
          items={engineer.specializations ?? []}
          color="blue"
          max={2}
        />
        <TagGroup label="OEMs tags" items={engineer.oemTags ?? []} color="orange" max={2} />
        <TagGroup
          label="Equipment types"
          items={engineer.equipmentTypes ?? []}
          color="gray"
          max={2}
        />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/service-engineers/profile?id=${engineer._id}&view=request`);
        }}
        className={`mt-auto inline-flex min-h-[42px] w-full items-center justify-center rounded-[10px] border text-[13px] font-semibold transition-colors ${
          busy
            ? "cursor-not-allowed border-[#dce4ef] bg-[#f5f7fa] text-[#a3b0c2]"
            : "border-[#69b1ff] bg-[#ecf6ff] text-[#204c84] hover:bg-[#e3f1ff]"
        }`}
      >
        {busy ? "Unavailable" : "Request engineer"}
      </button>
    </article>
  );
}
