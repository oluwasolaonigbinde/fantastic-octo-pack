"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import SafeProductImage from "@/components/product/SafeProductImage";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/utils/productDisplay";

interface ProductImageGalleryProps {
  mainImage: string;
  thumbnails: string[];
  title: string;
}

function sanitizeUrl(url: string | undefined): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ProductImageGallery({
  mainImage,
  thumbnails,
  title,
}: ProductImageGalleryProps) {
  const imageList = useMemo(() => {
    const items = [mainImage, ...thumbnails]
      .map((item) => sanitizeUrl(item))
      .filter((item): item is string => item !== null);

    return Array.from(new Set(items)).slice(0, 6);
  }, [mainImage, thumbnails]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = imageList[selectedIndex] ?? PRODUCT_IMAGE_PLACEHOLDER;
  const imageCount = imageList.length || 1;

  const selectPrevious = () => {
    setSelectedIndex((index) => (index - 1 + imageCount) % imageCount);
  };

  const selectNext = () => {
    setSelectedIndex((index) => (index + 1) % imageCount);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#DDE0E5] bg-white">
      <div className="relative aspect-square w-full overflow-hidden bg-white md:h-[440px] md:aspect-auto">
        <SafeProductImage
          src={activeImage}
          alt={title}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 320px, 665px"
        />

        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-[#4B5563] shadow-sm md:hidden">
          {selectedIndex + 1} of {imageCount}
        </div>
      </div>

      <div className="mx-auto my-4 flex w-fit items-center justify-center gap-3 rounded-xl border border-[#C4C8CE] bg-[#F3F4F6] p-2 md:absolute md:bottom-[18px] md:left-1/2 md:my-0 md:-translate-x-1/2">
        <button
          type="button"
          onClick={selectPrevious}
          aria-label="Previous product image"
          className="flex size-5 items-center justify-center text-[#4B5563]"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(3, imageCount) }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show product image ${index + 1}`}
              onClick={() => setSelectedIndex(index)}
              className={`size-[6px] rounded-full md:size-2 ${
                index === selectedIndex ? "bg-[#FE6E00]" : "bg-[#FFB27A]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={selectNext}
          aria-label="Next product image"
          className="flex size-5 items-center justify-center text-[#4B5563]"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
