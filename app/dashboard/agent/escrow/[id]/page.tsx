import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  CircleAlert,
} from "lucide-react";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string }>;
}

const deliverySteps = [
  "Create order",
  "Payment",
  "Delivery",
  "Packaging",
  "Dispatched",
  "Delivery completed",
  "Installation",
  "Completed",
];

const orderFacts = [
  ["Order ID", "Order ID"],
  ["Name of item", "Product name"],
  ["Quantity", "5"],
  ["Unit price", "Samuel Smart"],
  ["Total price", "\u20A6150, 000"],
  ["Commission", "\u20A6150, 000"],
  ["Payment method", "ESCROW"],
  ["Date created", "25/09/2025"],
];

export default async function AgentEscrowDetailPage({ params }: PageProps) {
  await params;

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="ESCROW Management"
        description="Wednesday 10th September, 2025"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-5 bg-[#F5F7FA] p-5 md:p-6">
        <Link
          href="/dashboard/agent/escrow"
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-4 md:p-5">
          <div className="md:hidden">
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <Image
                src="/images/admin-agent-product.jpg"
                alt="MRI Machine"
                width={640}
                height={260}
                className="h-[148px] w-full object-cover"
                priority
              />
            </div>

            <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg bg-[#FE6E00] text-sm font-medium text-white">
              <CheckSquare size={16} />
              Awaiting payment
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              {orderFacts.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-[#8A93A5]">{label}</p>
                  <p
                    className={`mt-2 text-[14px] font-medium ${
                      label === "ESCROW Status"
                        ? "text-[#FFC000]"
                        : "text-[#111827]"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs text-[#8A93A5]">ESCROW Status</p>
                <p className="mt-2 text-[14px] font-medium text-[#FFC000]">
                  In ESCROW
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex md:items-start md:gap-10">
            <div className="flex size-[146px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <Image
                src="/images/admin-agent-product.jpg"
                alt="MRI Machine"
                width={220}
                height={146}
                className="h-full w-full object-cover"
                priority
              />
            </div>

            <div className="grid flex-1 gap-7">
              <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_180px] items-start gap-5">
                {[
                  ["Order ID", "Order ID"],
                  ["Name of item", "Product name"],
                  ["Name of buyer", "Samuel Smart"],
                  ["Quantity", "5"],
                  ["Unit price", "\u20A6150, 000"],
                  ["Total price", "\u20A6150. 000"],
                  ["Commission", "\u20A6150, 000"],
                ].map(([label, value]) => (
                  <FactCell key={label} label={label} value={value} withDivider />
                ))}
                <div className="flex justify-end">
                  <span className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-[#FE6E00] px-5 text-base font-medium text-white">
                    <CheckSquare size={16} />
                    In delivery
                  </span>
                </div>
              </div>

              <div className="grid max-w-[740px] grid-cols-4 gap-5">
                <FactCell label="Payment method" value="ESCROW" />
                <FactCell label="Escrow timeline" value="3 days" withDivider />
                <FactCell label="Expected release" value="16 - 01 - 2026" withDivider />
                <FactCell label="ESCROW Status" value="In Escrow" tone="text-[#FE6E00]" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-4 md:p-5">
          <h2 className="text-[18px] font-medium text-[#111827] md:text-[20px]">
            Delivery status
          </h2>

          <div className="mt-6 md:hidden">
            <div className="space-y-5">
              {deliverySteps.map((step, index) => {
                const complete = index <= 2;
                const muted = index > 2;

                return (
                  <div key={step} className="flex gap-4">
                    <div className="flex w-10 flex-col items-center">
                      <span
                        className={`flex size-6 items-center justify-center rounded-sm ${
                          complete ? "bg-[#1FAF38]" : "bg-[#E7EAEE]"
                        }`}
                      >
                        {complete ? (
                          <Check size={14} className="text-white" />
                        ) : null}
                      </span>
                      {index < deliverySteps.length - 1 ? (
                        <span
                          className={`mt-1 h-8 w-px ${
                            index < 2 ? "bg-[#1FAF38]" : "bg-[#E5E7EB]"
                          }`}
                        />
                      ) : null}
                    </div>
                    <p
                      className={`pt-0.5 text-[16px] ${
                        muted ? "text-[#30374A]" : "text-[#1FAF38]"
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 hidden md:block">
            <div className="grid grid-cols-8 gap-0">
              {deliverySteps.map((step, index) => {
                const complete = index <= 2;
                return (
                  <div key={step} className="min-w-0">
                    <div className="flex items-center">
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-sm ${
                          complete ? "bg-[#1FAF38]" : "bg-[#D8DDE5]"
                        }`}
                      >
                        {complete ? <Check size={12} className="text-white" /> : null}
                      </span>
                      {index < deliverySteps.length - 1 ? (
                        <span
                          className={`mx-2 h-px flex-1 ${
                            index < 2 ? "bg-[#1FAF38]" : "border-t border-dashed border-[#D8DDE5]"
                          }`}
                        />
                      ) : null}
                    </div>
                    <p
                      className={`mt-4 pr-3 text-[16px] ${
                        complete ? "text-[#1FAF38]" : "text-[#30374A]"
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 border-t border-[#E5E7EB] pt-8">
            <h3 className="text-[18px] font-medium text-[#111827] md:text-[22px]">
              Delivery Address
            </h3>
            <div className="mt-5 space-y-2 text-[#111827]">
              <p className="text-[18px] font-medium">Samuel Smart</p>
              <p className="text-[14px] md:text-[18px]">
                38 Asheik Jarma Street, Jabi Abuja
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[14px] md:text-[18px]">
                <span>example55@gmail.com</span>
                <span>090384736378</span>
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-[#0D7CF2]">
              <CircleAlert size={18} />
              Default address
            </p>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function FactCell({
  label,
  value,
  tone = "text-[#111827]",
  withDivider = false,
}: {
  label: string;
  value: string;
  tone?: string;
  withDivider?: boolean;
}) {
  return (
    <div className={withDivider ? "border-r border-[#E5E7EB] pr-4 last:border-r-0" : ""}>
      <p className="text-xs text-[#8A93A5]">{label}</p>
      <p className={`mt-2 text-[16px] font-medium ${tone}`}>{value}</p>
    </div>
  );
}
