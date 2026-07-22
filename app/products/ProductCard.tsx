"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckSquare, MapPin } from "lucide-react";
import ConditionBadge from "@/components/product/ConditionBadge";
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

  return (
    <Link href={`/products/${id}`} className="block h-full" prefetch={false}>
      <div className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[16px] border border-[#DDE0E5] bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-[24px]">
        {/* Image area with gradient background */}
        <div className="relative h-[160px] w-full overflow-hidden bg-gradient-to-b from-[#FDFDFE] from-[39%] to-[#E0E3E8] sm:h-[239px]">
          <div className="absolute inset-0 m-auto h-full w-[95%] overflow-hidden rounded-[16px]">
            <Image
              src={currentImageSrc}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 50vw,
                     (max-width: 1024px) 50vw,
                     33vw"
              onError={() => {
                if (currentImageSrc !== LOCAL_PRODUCT_PLACEHOLDER_SRC) {
                  setFailedImageSrc(resolvedImageSrc);
                }
              }}
            />
          </div>
          <ConditionBadge condition={condition} overlay />
        </div>

        {/* Title */}
        <div className="flex flex-1 flex-col px-3 sm:px-4">
          <h3 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-medium leading-tight text-[#111827] sm:mt-4 sm:min-h-[64px] sm:text-[20px] sm:leading-[32px]">
            {title}
          </h3>

          {/* Stock + Location (left) & Price (right) */}
          <div className="mt-2 flex flex-col gap-1.5 pb-3 sm:gap-2 sm:pb-4">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-[5px]">
                <CheckSquare
                  size={14}
                  className={isAvailable ? "shrink-0 text-[#13A83B]" : "shrink-0 text-gray-400"}
                />
                <span className="truncate text-xs leading-tight text-[#4B5563] sm:text-[16px] sm:leading-[24px]">
                  {stockLabel}
                </span>
              </div>

              {location ? (
                <div className="flex items-center gap-[5px]">
                  <MapPin size={14} className="shrink-0 text-[#13A83B]" />
                  <span className="truncate text-xs leading-tight text-[#4B5563] sm:text-[16px] sm:leading-[24px]">
                    {location}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="inline-flex w-fit items-center rounded-[8px] bg-[rgba(254,110,0,0.04)] px-2 py-1">
              <p className="text-base font-bold leading-tight text-[#E89F5E] sm:text-[22px] sm:leading-[40px]">
                {price}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
