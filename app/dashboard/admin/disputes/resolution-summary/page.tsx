"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import { useAppSelector } from "@/hooks/useAppSelector";
import { serviceDisputeService } from "@/services/serviceDisputeService";
import { ServiceDisputeData } from "@/types/service-dispute";
import { ServiceRequestData, ServiceRequestParty } from "@/types/service-request";

function hasValue(value?: string | number | null): value is string | number {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    typeof value === "number"
  );
}

function firstFilled(...values: Array<string | number | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "string" && hasValue(value)) {
      return value;
    }
  }

  return null;
}

function getServiceRequest(dispute: ServiceDisputeData | null): ServiceRequestData | null {
  return dispute?.serviceRequest && typeof dispute.serviceRequest === "object"
    ? dispute.serviceRequest
    : null;
}

function getServiceRequestId(dispute: ServiceDisputeData | null): string | null {
  if (
    dispute?.serviceRequest &&
    typeof dispute.serviceRequest === "object" &&
    "_id" in dispute.serviceRequest
  ) {
    return dispute.serviceRequest._id;
  }

  return typeof dispute?.serviceRequest === "string" ? dispute.serviceRequest : null;
}

function getPartyName(
  party: string | ServiceRequestParty | undefined,
): string | null {
  if (!party || typeof party === "string") {
    return null;
  }

  const fullName = [party.firstName, party.lastName].filter(Boolean).join(" ").trim();

  return (
    fullName ||
    party.businessName ||
    party.distributorStoreProfile?.businessName ||
    party.organization ||
    party.email ||
    party.phoneNumber ||
    null
  );
}

function formatCurrency(value?: number | string | null): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/\u00A0/g, " ");
  }

  if (!hasValue(value)) {
    return null;
  }

  const numericValue = Number(value);

  if (
    typeof value === "string" &&
    Number.isFinite(numericValue) &&
    /^-?\d+(\.\d+)?$/.test(value.trim())
  ) {
    return formatCurrency(numericValue);
  }

  return typeof value === "string" ? value : String(value);
}

function formatSummaryDate(value?: string | null): string | null {
  if (!hasValue(value)) {
    return null;
  }

  if (typeof value === "string" && value.includes("/")) {
    return value;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(parsedDate);
}

function deriveQuantity(serviceRequest: ServiceRequestData | null): string | null {
  if (!serviceRequest) {
    return null;
  }

  const unitPrice = serviceRequest.unitPrice;
  const totalAmount = serviceRequest.price ?? serviceRequest.unitPrice;

  if (
    typeof unitPrice !== "number" ||
    !Number.isFinite(unitPrice) ||
    unitPrice <= 0 ||
    typeof totalAmount !== "number" ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0
  ) {
    return null;
  }

  const quantity = totalAmount / unitPrice;

  return Number.isInteger(quantity) && quantity > 0 ? String(quantity) : null;
}

export default function AdminDisputeResolutionSummaryPage() {
  const searchParams = useSearchParams();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [liveDispute, setLiveDispute] = useState<ServiceDisputeData | null>(null);

  const routedSnapshot = useMemo(
    () => ({
      disputeId: searchParams.get("disputeId") ?? "",
      invoiceId: searchParams.get("invoiceId") ?? "",
      itemName: searchParams.get("itemName") ?? "",
      unitPrice: searchParams.get("unitPrice") ?? "",
      quantity: searchParams.get("quantity") ?? "",
      totalAmount: searchParams.get("totalAmount") ?? "",
      buyerName: searchParams.get("buyerName") ?? "",
      distributorName: searchParams.get("distributorName") ?? "",
      paymentMethod: searchParams.get("paymentMethod") ?? "",
      distributorAccount: searchParams.get("distributorAccount") ?? "",
      bankName: searchParams.get("bankName") ?? "",
      dateCreated: searchParams.get("dateCreated") ?? "",
    }),
    [searchParams],
  );

  useEffect(() => {
    if (!token || !routedSnapshot.disputeId) {
      return;
    }

    let isMounted = true;

    const loadDispute = async () => {
      try {
        const nextDispute = await serviceDisputeService.fetchServiceDisputeById(
          token,
          routedSnapshot.disputeId,
          true,
        );

        if (isMounted) {
          setLiveDispute(nextDispute);
        }
      } catch {
        if (isMounted) {
          setLiveDispute(null);
        }
      }
    };

    void loadDispute();

    return () => {
      isMounted = false;
    };
  }, [routedSnapshot.disputeId, token]);

  const closeHref = routedSnapshot.disputeId
    ? `/dashboard/admin/disputes?disputeId=${encodeURIComponent(routedSnapshot.disputeId)}`
    : "/dashboard/admin/disputes";

  const rows = useMemo(() => {
    const serviceRequest = getServiceRequest(liveDispute);
    const liveUnitPrice = formatCurrency(serviceRequest?.unitPrice);
    const liveTotalAmount = formatCurrency(serviceRequest?.price ?? serviceRequest?.unitPrice);

    return [
      [
        "Invoice ID",
        firstFilled(
          getServiceRequestId(liveDispute),
          routedSnapshot.invoiceId,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.invoiceId,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.invoiceId,
        false,
      ],
      [
        "Item",
        firstFilled(
          serviceRequest?.equipmentName,
          routedSnapshot.itemName,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.itemName,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.itemName,
        false,
      ],
      [
        "Unit price",
        firstFilled(
          liveUnitPrice,
          formatCurrency(routedSnapshot.unitPrice),
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.unitPrice,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.unitPrice,
        true,
      ],
      [
        "Quantity",
        firstFilled(
          deriveQuantity(serviceRequest),
          routedSnapshot.quantity,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.quantity,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.quantity,
        false,
      ],
      [
        "Total amount",
        firstFilled(
          liveTotalAmount,
          formatCurrency(routedSnapshot.totalAmount),
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.totalAmount,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.totalAmount,
        true,
      ],
      [
        "Buyer's name",
        firstFilled(
          getPartyName(liveDispute?.buyer),
          routedSnapshot.buyerName,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.buyerName,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.buyerName,
        false,
      ],
      [
        "Distributor's name",
        firstFilled(
          getPartyName(liveDispute?.engineer),
          routedSnapshot.distributorName,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.distributorName,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.distributorName,
        false,
      ],
      [
        "Payment method",
        firstFilled(
          routedSnapshot.paymentMethod,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.paymentMethod,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.paymentMethod,
        false,
      ],
      [
        "Distributor's account",
        firstFilled(
          routedSnapshot.distributorAccount,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.distributorAccount,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.distributorAccount,
        false,
      ],
      [
        "Bank name",
        firstFilled(
          routedSnapshot.bankName,
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.bankName,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.bankName,
        false,
      ],
      [
        "Date created",
        firstFilled(
          formatSummaryDate(liveDispute?.createdAt),
          formatSummaryDate(routedSnapshot.dateCreated),
          ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.dateCreated,
        ) ?? ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK.dateCreated,
        false,
      ],
    ] as const;
  }, [liveDispute, routedSnapshot]);

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[360px] overflow-y-auto bg-white text-gray1 shadow-xl">
      <header className="flex min-h-[92px] items-center justify-between border-b border-[#E6ECF2] px-5">
        <h1 className="text-[18px] font-semibold leading-[24px] text-[#111827]">
          Resolution Summary
        </h1>
        <Link
          href={closeHref}
          aria-label="Close resolution summary"
          className="flex size-6 items-center justify-center text-[#111827]"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="space-y-8 px-5 py-6">
        {rows.map(([label, value, emphasized]) => (
          <div key={label} className="space-y-2">
            <p className="text-sm leading-5 text-[#6B7280]">{label}</p>
            <p
              className={`leading-8 text-[#111827] ${
                emphasized ? "text-[20px] font-medium" : "text-[16px]"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}
