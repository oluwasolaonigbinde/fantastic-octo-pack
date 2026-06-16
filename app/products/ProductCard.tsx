"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckSquare, MapPin } from "lucide-react";
import { ProductImage } from "@/types/product";

const LOCAL_PRODUCT_PLACEHOLDER_SRC = "/images/product 2.webp";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  imageSrc?: ProductImage;
  stockLabel: string;
  isAvailable: boolean;
  location?: string | null;
  condition?: string | null;
}

export default function ProductCard({
  id,
  title,
  price,
  imageSrc,
  stockLabel,
  isAvailable,
  location,
  condition,
}: ProductCardProps) {
  const resolvedImageSrc = imageSrc?.url ?? LOCAL_PRODUCT_PLACEHOLDER_SRC;
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const currentImageSrc =
    failedImageSrc === resolvedImageSrc
      ? LOCAL_PRODUCT_PLACEHOLDER_SRC
      : resolvedImageSrc;

  const conditionLabel = condition
    ? condition.charAt(0).toUpperCase() + condition.slice(1)
    : null;

  return (
    <Link href={`/products/${id}`} className="block h-full" prefetch={false}>
      <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        {/* Image area with gradient background */}
        <div className="relative h-[239px] w-full overflow-hidden bg-gradient-to-b from-[#FDFDFE] from-[39%] to-[#E0E3E8]">
          <div className="absolute inset-0 m-auto h-full w-[95%] overflow-hidden rounded-[16px]">
            <Image
              src={currentImageSrc}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw,
                     (max-width: 1024px) 50vw,
                     33vw"
              onError={() => {
                if (currentImageSrc !== LOCAL_PRODUCT_PLACEHOLDER_SRC) {
                  setFailedImageSrc(resolvedImageSrc);
                }
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-1 flex-col px-4">
          <h3 className="mt-4 line-clamp-2 min-h-[64px] text-[20px] font-medium leading-[32px] text-[#111827]">
            {title}
          </h3>

          {/* Stock + Location (left) & Price (right) */}
          <div className="mt-2 flex items-start justify-between gap-3 pb-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-[5px]">
                <CheckSquare
                  size={16}
                  className={isAvailable ? "text-[#13A83B]" : "text-gray-400"}
                />
                <span className="text-[16px] leading-[24px] text-[#4B5563]">
                  {stockLabel}
                </span>
              </div>

              {location ? (
                <div className="flex items-center gap-[5px]">
                  <MapPin size={16} className="shrink-0 text-[#13A83B]" />
                  <span className="text-[16px] leading-[24px] text-[#4B5563]">
                    {location}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center justify-center self-stretch rounded-[8px] bg-[rgba(254,110,0,0.04)] px-2 py-1">
              <p className="whitespace-nowrap text-[22px] font-bold leading-[40px] text-[#E89F5E]">
                {price}
              </p>
            </div>
          </div>
        </div>

        {/* Condition bar */}
        <div className="mt-auto w-full bg-[#F6F7F9] px-4 py-4">
          <p className="text-[18px] leading-[28px] text-[#4B5563]">
            Condition:{" "}
            <span className="font-semibold">{conditionLabel ?? "N/A"}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
