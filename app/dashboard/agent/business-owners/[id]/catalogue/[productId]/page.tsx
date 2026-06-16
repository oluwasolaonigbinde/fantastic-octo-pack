import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";

import Header from "../../../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

const specs = [
  "Brand: Minfound (China)",
  "Model: Superconductive Scintcare 1.5T",
  "Magnetic field strength : 1.5 Tesla",
  "Bore/ Aperture diameter:  60cm",
  "Coil Technology: Full-body / integrated coil design",
  "Gradient System: 1.5 T gradient system supports gradient engineering consistent with a 1.5 T magnet",
  "Clinical Applications: Nerves, blood vessels, abdomen, pelvis, breast, tumour imaging",
  "Workflow/ features: Automatic scan localization, RAC anti-motion artifact technology",
  "Helium boil-off rate/cooling: Helium evaporation rate < 0.01 litre per hour; Helium recharge period > 10 years.",
];

export default async function AgentBusinessOwnerProductDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-5 md:p-6">
        <Link
          href={`/dashboard/agent/business-owners/${id}/catalogue`}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="flex min-h-[120px] items-center justify-between rounded-xl border border-[#DDE2EA] bg-white px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/icons/OEMBranding.svg"
              alt=""
              width={52}
              height={52}
              className="size-[52px]"
            />
            <p className="text-[18px] font-medium text-[#111827]">OEM Branding</p>
          </div>

          <div className="flex min-w-[386px] items-center justify-between rounded-xl border border-[#75F18B] bg-[#DFFFF0] px-8 py-4">
            <span className="text-[16px] text-[#111827]">Verification status</span>
            <span className="inline-flex h-[50px] items-center gap-3 rounded-md bg-[#13A83B] px-5 text-[16px] font-medium text-white">
              <CheckSquare size={18} />
              Approved
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#DDE2EA] bg-white">
          <div className="grid gap-6 p-5 lg:grid-cols-[502px_minmax(0,1fr)]">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex size-[88px] items-center justify-center overflow-hidden rounded-lg border border-[#DDE2EA] bg-[#F8FAFC]"
                  >
                    <Image
                      src="/images/admin-agent-product.jpg"
                      alt=""
                      width={78}
                      height={78}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="flex h-[400px] items-center justify-center overflow-hidden rounded-lg border border-[#DDE2EA] bg-white">
                <Image
                  src="/images/admin-agent-product.jpg"
                  alt="MRI product"
                  width={520}
                  height={430}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="pt-2">
              <h1 className="text-[28px] font-medium leading-tight text-[#111827]">
                MRI (Magnetic Resonance Imaging)
              </h1>
              <div className="mt-4 inline-flex rounded-lg bg-[#C7EFFB] px-5 py-3 text-[18px] font-medium text-[#0669D9]">
                25 In stock
              </div>
              <p className="mt-5 text-[28px] font-medium leading-none text-[#03265C]">
                {"\u20A6"}175,000
              </p>

              <div className="mt-10 max-w-[580px]">
                <h2 className="text-[18px] font-medium text-[#111827]">
                  Description
                </h2>
                <p className="mt-3 text-[16px] leading-10 text-[#111827]">
                  The ScintCare MRI systems from Minfound are high-performing,
                  clinically versatile magnetic resonance imaging machines,
                  designed to deliver high image quality, patient comfort and
                  workflow efficiency. They incorporate advanced magnet, coil and
                  RF technologies suited for a wide range of diagnostic.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#DDE2EA] px-5 py-14">
            <h2 className="text-[18px] font-medium text-[#111827]">
              Key Specifications
            </h2>
            <ul className="mt-4 space-y-4 text-[16px] leading-10 text-[#111827]">
              {specs.map((spec) => (
                <li key={spec} className="flex gap-4">
                  <span className="pt-1">.</span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>
    </ProtectedRoute>
  );
}
