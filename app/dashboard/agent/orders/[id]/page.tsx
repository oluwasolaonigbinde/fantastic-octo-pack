"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Download } from "lucide-react";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { agentOrders } from "../../mockdata";

const deliverySteps = [
  ["Create order", true],
  ["Payment", true],
  ["Delivery", true],
  ["Packaging", false],
  ["Dispatched", false],
  ["Delivery completed", false],
  ["Installation", false],
  ["Completed", false],
] as const;

export default function AgentOrderDetailPage() {
  const searchParams = useSearchParams();
  const order = agentOrders[0];
  const showDelivery = searchParams.get("view") === "delivery";

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header title="Orders" description="Wednesday 10th September, 2025" />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] px-5 py-6 md:p-4">
        <Link
          href="/dashboard/agent/orders"
          className="hidden items-center gap-2 text-base text-[#111827] hover:text-[#0669D9] md:inline-flex"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <OrderSummaryCard
          amount={order.amount}
          commission={order.amount}
          paymentMethod={order.paymentMethod}
          dateCreated={order.dateCreated}
          escrowStatus={order.escrowStatus}
        />

        {showDelivery ? (
          <>
            <DesktopDeliveryStatus />
            <OrderDetailInfo showDeliveryButton />
          </>
        ) : (
          <MobileDeliveryStatus />
        )}
      </main>
    </ProtectedRoute>
  );
}

function OrderSummaryCard({
  amount,
  commission,
  paymentMethod,
  dateCreated,
  escrowStatus,
}: {
  amount: string;
  commission: string;
  paymentMethod: string;
  dateCreated: string;
  escrowStatus: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE0E5] bg-white px-3 pb-3 pt-5 md:p-5">
      <div className="grid gap-5 md:grid-cols-[145px_minmax(0,1fr)_172px] md:items-start md:gap-12">
        <div className="order-1 flex h-[153px] w-full items-center justify-center overflow-hidden rounded-lg border border-[#DDE0E5] bg-white md:size-[145px]">
          <Image
            src="/images/admin-agent-product.jpg"
            alt="MRI machine"
            width={400}
            height={300}
            className="h-full w-full object-cover object-center"
            priority
          />
        </div>

        <span className="order-2 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#FE6E00] px-4 text-base font-medium text-white md:order-3 md:w-[172px]">
          <Check size={14} className="rounded-sm bg-white p-0.5 text-[#FE6E00]" />
          Awaiting payment
        </span>

        <div className="order-3 mt-5 md:order-2 md:mt-0">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-6 md:gap-x-5">
            <Detail label="Order ID" value="Order ID" />
            <Detail label="Name of product" value="Product name" />
            <Detail label="Quantity" value="5" />
            <Detail label="Unit price" value="Samuel Smart" />
            <Detail label="Total price" value={amount} />
            <Detail label="Commission" value={commission} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-[#F3F4F6] pt-5 md:grid-cols-4 md:gap-x-8">
            <Detail label="Payment method" value={paymentMethod} />
            <Detail label="Date created" value={dateCreated} />
            <Detail label="Date expected" value="16 - 01 - 2026" className="hidden md:block" />
            <Detail label="ESCROW Status" value={escrowStatus} valueClassName="text-[#FE6E00]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  className = "",
  valueClassName = "text-[#111827]",
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-[#667085]">{label}</p>
      <p className={`mt-2 font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DesktopDeliveryStatus() {
  return (
    <div className="hidden rounded-2xl border border-[#DDE0E5] bg-white px-5 pb-7 pt-6 md:block">
      <p className="mb-12 text-xl font-medium text-[#111827]">Delivery status</p>
      <div className="grid grid-cols-8 items-start">
        {deliverySteps.map(([label, active], index) => (
          <div key={label} className="relative flex flex-col items-center gap-4">
            {index > 0 ? (
              <span
                className={`absolute left-0 top-[11px] h-px w-1/2 ${
                  active ? "bg-[#13A83B]" : "bg-[#DDE0E5]"
                }`}
              />
            ) : null}
            {index < deliverySteps.length - 1 ? (
              <span
                className={`absolute right-0 top-[11px] h-px w-1/2 ${
                  active ? "bg-[#13A83B]" : "bg-[#DDE0E5]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-5 items-center justify-center rounded ${
                active ? "bg-[#13A83B]" : "bg-[#DDE0E5]"
              }`}
            >
              <Check size={12} className="text-white" />
            </span>
            <span className={active ? "text-[#13A83B]" : "text-[#111827]"}>{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <p className="mb-5 text-xl font-medium text-[#111827]">Delivery Address</p>
        <p className="mb-3 text-base font-medium text-[#111827]">Samuel Smart</p>
        <p className="mb-3 text-base text-[#111827]">38 Asheik Jarma Street, Jabi Abuja</p>
        <p className="mb-4 text-base text-[#111827]">
          example55@gmail.com <span className="ml-8">090384736378</span>
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-[#0669D9]">
          <span className="flex size-4 items-center justify-center rounded-full border border-[#0669D9] text-xs">
            i
          </span>
          Default address
        </p>
      </div>
    </div>
  );
}

function OrderDetailInfo({ showDeliveryButton }: { showDeliveryButton: boolean }) {
  return (
    <div className="grid gap-4 md:hidden">
      <div className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
        <p className="mb-8 font-semibold text-[#111827]">Payment Information</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Detail label="Payment Method" value="Bank transfer" />
          <div>
            <p className="text-xs text-[#667085]">Documents</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#111827]">
              <span className="flex size-5 items-center justify-center rounded bg-[#DCFCE7] text-[#13A83B]">
                <Download size={11} />
              </span>
              Invoice.pdf
              <Download size={16} className="text-[#FE6E00]" />
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-[#667085]">Payment Details</p>
            <p className="mt-2 text-sm text-[#111827]">Items total: N175,000</p>
            <p className="mt-2 text-sm text-[#111827]">Delivery fee: N1,000</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
        <p className="mb-8 font-semibold text-[#111827]">Delivery Address</p>
        <p className="text-sm leading-6 text-[#111827]">
          Lorem ipsum dolor sit amet consectetur. Cras arcu sit massa consequat mi quis purus.
          Arcu enim sit sed aenean lorem tincidunt. Arcu mauris dictumst sed bibendum. Aliquet
          urna fusce amet nec nec in pretium.
        </p>
        {showDeliveryButton ? (
          <Link
            href="/dashboard/agent/orders/ORDER-0010-0"
            className="mt-8 inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-xl border border-[#0669D9] bg-[#EAF8FF] text-base font-medium text-[#0B2341]"
          >
            View delivery status <ArrowRight size={20} />
          </Link>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
        <p className="mb-8 font-semibold text-[#111827]">Supplier Information</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8">
          <Detail label="Full name" value="Samuel Smart" />
          <Detail label="Role" value="Supplier" />
          <Detail label="Phone number" value="00987899977" />
          <Detail label="Email address" value="Bank transfer" />
        </div>
      </div>
    </div>
  );
}

function MobileDeliveryStatus() {
  return (
    <div className="rounded-2xl border border-[#DDE0E5] bg-white p-5 md:hidden">
      <p className="mb-8 text-xl font-medium text-[#111827]">Delivery status</p>
      <div className="space-y-8">
        {deliverySteps.map(([label, active], index) => (
          <div key={label} className="relative flex items-center gap-9">
            {index < deliverySteps.length - 1 ? (
              <span
                className={`absolute left-[9px] top-6 h-8 w-px ${
                  active ? "bg-[#13A83B]" : "bg-[#DDE0E5]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-5 items-center justify-center rounded ${
                active ? "bg-[#13A83B]" : "bg-[#DDE0E5]"
              }`}
            >
              <Check size={12} className="text-white" />
            </span>
            <span className={active ? "text-[#13A83B]" : "text-[#111827]"}>{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-[#F3F4F6] pt-10">
        <p className="mb-6 text-xl font-medium text-[#111827]">Delivery Address</p>
        <p className="mb-4 text-base font-medium text-[#111827]">Samuel Smart</p>
        <p className="mb-3 text-sm text-[#111827]">38 Asheik Jarma Street, Jabi Abuja</p>
        <p className="mb-3 text-sm text-[#111827]">
          example55@gmail.com <span className="ml-8">090384736378</span>
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-[#0669D9]">
          <span className="flex size-4 items-center justify-center rounded-full border border-[#0669D9] text-xs">
            i
          </span>
          Default address
        </p>
      </div>
    </div>
  );
}
