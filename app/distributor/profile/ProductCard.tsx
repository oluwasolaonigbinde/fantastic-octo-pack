"use client";

import Image from "next/image";
import { Button } from "@/components/base";
import { Product, ProductImage } from "@/types/product";
import Link from "next/link";
// import RightSlider from "@/components/right-slider";
// import RequestQuoteModal from "@/components/request-quote-modal";
// import PopUp from "@/components/pop-up";
import { useState } from "react";
import { RightSlider } from "@/components/base";
import RequestQuoteModal from "@/app/products/[id]/RequestQuoteModal";
import { PopUp } from "@/components/base";
import { getProductAvailabilityLabel } from "@/utils/productDisplay";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isRequestQuoteModalOpen, setIsRequestQuoteModalOpen] = useState(false);
  const [isRequestQuotePopupOpen, setRequestQuotePopupOpen] = useState(false);
  const id = product._id;
  const title = product.name;
  const imageSrc = product.images.find((img) => img.isDefault === true) as
    | ProductImage
    | undefined;
  const priceText = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(product.pricePerUnit || 0));
  const stockText = getProductAvailabilityLabel(product);
  return (
    <>
      <div className="border border-gray-200 rounded-2xl p-4 flex flex-col hover:shadow-md transition space-y-2">
        <Link href={`/products/${id}`} className="block" prefetch={false}>
          <div className="relative w-full h-40 sm:h-48 rounded-md overflow-hidden bg-gray-100">
            <Image
              src={imageSrc?.url ?? "/images/product 2.webp"}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="mt-3 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">{stockText}</p>
            <p className="text-[#FF7900] font-semibold mt-1">{priceText}</p>
            </div>
          </div>
        </Link>

        <Button
          title="Request Quote"
          variant="primaryLight"
          size="md"
          onClick={() => {
            setIsRequestQuoteModalOpen(true);
          }}
          className=" sm:w-auto!"
        />
      </div>

      <RightSlider
        open={isRequestQuoteModalOpen}
        onClose={() => setIsRequestQuoteModalOpen(false)}
        title="Request Quote"
      >
        <RequestQuoteModal
          setIsMessageDistributorModalOpen={setIsRequestQuoteModalOpen}
          onOpenPopup={() => setRequestQuotePopupOpen(true)}
        />
      </RightSlider>

      {/* Request Quote Popup */}
      <PopUp
        open={isRequestQuotePopupOpen}
        type="success"
        variant="one-button"
        title="Congratulations"
        description="You have successfully sent a request for quote. you'll be connected shortly."
        primaryButtonText="Okay"
        onClose={() => setRequestQuotePopupOpen(false)}
        showIcon={true}
      />
    </>
  );
}

