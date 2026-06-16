"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { PRODUCT_IMAGE_PLACEHOLDER } from "@/utils/productDisplay";

type SafeProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export default function SafeProductImage({
  src,
  fallbackSrc = PRODUCT_IMAGE_PLACEHOLDER,
  onError,
  ...props
}: SafeProductImageProps) {
  const normalizedSrc =
    typeof src === "string" && src.trim().length > 0 ? src.trim() : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

  useEffect(() => {
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
