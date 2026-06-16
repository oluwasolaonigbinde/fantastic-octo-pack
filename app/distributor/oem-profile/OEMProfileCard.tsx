"use client";

import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/base";
// import RightSlider from "@/components/right-slider";
// import MessageDistributorModal from "@/components/message-distributor-modal";




interface OEMProfileCardProps {
  name: string;
  phone?: string;
  email?: string;
  itemsListed: number;
  imageSrc: string;
  description?: string;
}

export default function OEMProfileCard({
  name,
  phone,
  email,
  itemsListed,
  imageSrc,
  description = "Figma ipsum component variant main layer. Community image asset overflow community editor distribute prototype layer inspect. Bullet create boolean flatten pen content layer frame clip group. Main duplicate vertical style connection draft. Ipsum ellipse auto content.",
}: OEMProfileCardProps) {
  const phoneValue = phone || "Not publicly listed";
  const emailValue = email || "Not publicly listed";
  

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
            src={imageSrc}
            alt={`${name} photo`}
            width={320}
            height={320}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Send Message Button */}
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

      {/* Info Section */}
      <div className="border rounded-2xl mt-6 w-full flex flex-col items-center py-6 px-4 sm:px-6 shadow-sm">
        {/* Verified Section */}
        <div className="flex items-center justify-center gap-2 bg-[#DFFFEF] border border-[#00B86E] text-[#00B86E] rounded-lg px-4 py-1 text-xs sm:text-sm font-medium">
          <CheckCircle size={16} />
          <span>Verified</span>
        </div>

        {/* Description */}
        <div className="w-full mt-6">
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            About OEM
          </h2>
          <p className="text-[#4B5563] text-[13px] sm:text-sm leading-relaxed text-left">
            {description}
          </p>
        </div>

        {/* OEM Info */}
        <div className="mt-6 w-full text-[13px] sm:text-sm">
          <h2 className="text-base sm:text-lg font-semibold mb-3">
            OEM&apos;s Information
          </h2>
          <div className="space-y-2">
            <InfoRow label="Name:" value={name} />
            <InfoRow label="Phone number:" value={phoneValue} />
            <InfoRow label="Email address:" value={emailValue} />
            <InfoRow label="Items listed:" value={`${itemsListed} items`} />
          </div>
        </div>

        {/* Official Distributors */}
        <div className="mt-8 w-full flex flex-col gap-4">
          <h2 className="text-base sm:text-lg font-semibold text-left">
            Official Distributors
          </h2>

          {[
            { color: "bg-[#1E73FF]", mouth: "#FF7900" },
            { color: "bg-[#FFC107]", mouth: "#00B86E" },
            { color: "bg-[#1E73FF]", mouth: "#FFC107" },
            { color: "bg-[#00B86E]", mouth: "#FFC107" },
            { color: "bg-[#FF5722]", mouth: "#1E73FF" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center w-full sm:w-[90%] rounded-lg px-3 py-2 border border-gray-300 hover:border-[#0066FF] transition-all"
            >
              {/* Left: Icon + Name */}
              <div className="flex items-center gap-3">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  {/* Pac-Man shape */}
                  <div
                    className={`absolute inset-0 ${item.color} rounded-full`}
                    style={{
                      clipPath:
                        "polygon(0% 0%, 100% 0%, 75% 50%, 100% 100%, 0% 100%)",
                    }}
                  ></div>

                  {/* Triangle mouth */}
                  <div
                    className="absolute -right-px w-0 h-0"
                    style={{
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: `8px solid ${item.mouth}`,
                    }}
                  ></div>
                </div>

                <span className="text-sm font-medium text-gray-800">
                  Distributor {i + 1}
                </span>
              </div>

              {/* Right arrow */}
              <span className="text-[#0066FF] text-lg font-semibold">→</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}

/** Helper for label/value layout */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between flex-wrap gap-1">
      <span className="text-[#4B5563]">{label}</span>
      <span className="text-[#111827] font-medium break-all text-right">
        {value}
      </span>
    </div>
  );
}
