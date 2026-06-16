"use client";

import Link from "next/link";
import { ArrowLeft, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";

import Header from "@/app/dashboard/component/header";

const specs = [
  ["Magnet Strength", "70ucm wide bore"],
  ["Bore Size", "16  ehuimal RF system : advanced imaging respients"],
  ["Imaging Technology", "1.5 Telsa"],
  ["Gradient Strength", "35 mT Jm"],
  ["Power Supply", "336-450v 90/50Hz"],
  ["Cooling System", "Helium coherent superducting magnet"],
  ["Installation Space", "1.5 Telsa"],
  ["Widget", "5: 60Omg"],
  ["User Interface", "16 inc coder monitor"],
] as const;

export default function AdminAgentDetailPage() {
  return (
    <div className="min-h-[1688px] bg-gray7">
      <Header
        title="Platform Users"
        description="View all users and process onboarding request from users"
      />

      <main className="px-4 pt-4">
        <Link
          href="/dashboard/admin/platform-users"
          className="inline-flex h-8 items-center gap-2 text-lg font-normal leading-8 text-primary"
        >
          <ArrowLeft size={24} strokeWidth={1.75} />
          Go Back
        </Link>

        <section className="mt-5 flex h-[136px] items-center justify-between rounded-2xl border border-gray5 bg-white px-8">
          <div className="flex items-center gap-4">
            <div className="relative size-8 overflow-hidden rounded-full bg-primary">
              <span className="absolute inset-y-0 right-0 w-1/2 bg-[#FE6E00]" />
            </div>
            <p className="text-base font-normal leading-6 text-gray1">
              This will be the name of the distributor
            </p>
          </div>

          <div className="flex h-[88px] w-[282px] items-center justify-between rounded-2xl border border-[#FFE079] bg-[#FFF6D9] px-8">
            <p className="text-base font-normal leading-6 text-[#272B36]">Product status</p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#FFC000] px-[18px] py-[11px] text-white">
              <CheckSquare size={18} strokeWidth={2.25} />
              <span className="text-lg font-normal leading-7">Pending</span>
            </div>
          </div>
        </section>

        <section className="mt-[14px] h-[1470px] rounded-2xl border border-gray5 bg-white p-10">
          <div className="flex gap-8">
            <div className="h-[414px] w-[556px] overflow-hidden rounded-[9px] border border-gray5 bg-white">
              <div className="flex h-[350px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/admin-agent-product.jpg"
                  alt=""
                  className="h-[300px] w-[470px] object-contain"
                />
              </div>
              <div className="flex justify-center">
                <div className="inline-flex h-[24px] items-center gap-2 rounded-lg border border-gray4 bg-gray6 px-2">
                  <ChevronLeft size={17} />
                  <span className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-[#FE6E00]" />
                    <span className="size-1.5 rounded-full bg-[#FE6E00]" />
                    <span className="size-1.5 rounded-full bg-[#FE6E00]" />
                  </span>
                  <ChevronRight size={17} />
                </div>
              </div>
            </div>

            <div className="flex min-h-[414px] flex-1 flex-col justify-between">
              <h1 className="max-w-[460px] text-[32px] font-semibold leading-[48px] text-black">
                MRI (Magnetic Resonance Imaging)
              </h1>
              <div className="space-y-5">
                <div className="flex h-16 w-[143px] items-center justify-center rounded-lg bg-[#C7EEFF] px-5 py-3">
                  <span className="text-2xl font-medium leading-10 text-primary">25 In stock</span>
                </div>
                <p className="text-[40px] font-medium leading-none text-[#03265C]">₦175,000</p>
              </div>
              <div className="border-t border-gray5" />
            </div>
          </div>

          <div className="mt-10 space-y-0 text-black">
            <h2 className="text-2xl font-medium leading-10">Description</h2>
            <p className="text-xl font-normal leading-8">
              The ScintCare MRI systems from Minfound are high-performing, clinically versatile
              magnetic resonance imaging machines, designed to deliver high image quality, patient
              comfort and workflow efficiency. They incorporate advanced magnet, coil and RF
              technologies suited for a wide range of diagnostic.
            </p>
          </div>

          <div className="mt-10">
            <h2 className="mb-5 text-[32px] font-semibold leading-[48px] text-gray1">
              Key Specifications
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray5">
              <div className="grid grid-cols-2 border-b border-gray5 bg-[#EEF0F4]">
                <div className="border-r border-gray5 px-4 py-3 text-2xl font-semibold leading-normal text-gray2">
                  Specifications
                </div>
                <div className="px-4 py-3 text-2xl font-semibold leading-normal text-gray2">
                  Details
                </div>
              </div>
              {specs.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 border-b border-gray5 last:border-b-0">
                  <div className="border-r border-gray5 bg-[#F8F8FA] px-4 py-3 text-2xl font-medium leading-normal text-gray2">
                    {label}
                  </div>
                  <div className="bg-[#FEFDFE] px-4 py-3 text-2xl font-medium leading-normal text-gray2">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
