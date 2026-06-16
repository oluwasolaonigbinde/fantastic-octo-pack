"use client";

import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/base";




interface DistributorProfileCardProps {
  name?: string;
  phone?: string;
  email?: string;
  itemsListed?: number;
  imageSrc?: string;
  description?: string;
}

export default function DistributorProfileCard({
  name,
  phone,
  email,
  itemsListed,
  imageSrc,
  description = "Figma ipsum component variant main layer. Community image asset overflow community editor distribute prototype layer inspect. Bullet create boolean flatten pen content layer frame clip group. Main duplicate vertical style connection draft. Ipsum ellipse auto content.",
}: DistributorProfileCardProps) {
  const displayName = name || "Distributor";
  const phoneValue = phone || "Not publicly listed";
  const emailValue = email || "Not publicly listed";
  const itemsListedValue = itemsListed || 0;
  const imageSrcValue = imageSrc || "/images/profile.png";

  return (
    <div className="bg-card text-black overflow-hidden flex flex-col items-center w-full max-w-md mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* Go Back Button */}
      {/* <button
        onClick={() => router.back()}
        className="self-start flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm mb-4 transition"
      >
        <ArrowLeft size={18} />
        <span>Go Back</span>
      </button> */}

      {/* Profile Image Section */}
      <div className="w-full border rounded-2xl p-4 sm:p-6 flex flex-col items-center shadow-sm">
        <div className="w-full max-w-[320px] aspect-square rounded-xl overflow-hidden">
          <Image
            src={imageSrcValue}
            alt={`${displayName} photo`}
            width={320}
            height={320}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Send Message Button */}
        {/* <button className="mt-4 w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium text-sm sm:text-base transition">
          Send Message
        </button> */}
        {/* <Button   
          title="Send Message"
          variant="primary"
          size="md"
          className=" mt-1"
        /> */}
        <Button
          title="Send Message"
          variant="primary"
          size="md"
          // onClick={() => {
          //   setIsMessageDistributorModalOpen(true);
          // }}
          className=" mt-1"
        />
        
      </div>

      {/* Info Card Section */}
      <div className="border rounded-2xl mt-6 w-full flex flex-col items-center py-6 px-4 sm:px-6 shadow-sm">
        {/* Verified + Logo Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
          {/* Verified Badge */}
          <div className="flex items-center gap-2 bg-[#DFFFEF] border border-[#00B86E] text-[#00B86E] rounded-lg px-4 py-1 text-xs sm:text-sm font-medium">
            <CheckCircle size={16} />
            <span>Verified</span>
          </div>

          {/* OEM Branding Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/icons/OEMBranding.svg"
              alt="OEM Branding logo"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-sm font-medium text-[#111827]">
              OEM Branding
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="w-full">
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            About Distributor
          </h2>
          <p className="text-[#4B5563] text-[13px] sm:text-sm leading-relaxed text-left">
            {description}
          </p>
        </div>

        {/* Distributor Info */}
        
        <div className="mt-6 w-full text-[13px] sm:text-sm">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            Distributor&apos;s Information
          </h2>

          <div className="space-y-2">
            <InfoRow label="Name:" value={displayName} />
            <InfoRow label="Phone number:" value={phoneValue} />
            <InfoRow label="Email address:" value={emailValue} />
            <InfoRow label="Items listed:" value={`${itemsListedValue} items`} />
          </div>
        </div>
      </div>


    </div>
  );
}

/** Small helper subcomponent for clean info layout */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between flex-wrap gap-1">
      <span className="text-[#4B5563]">{label}</span>
      <span className="text-[#111827] font-medium">{value}</span>
    </div>
  );
}

