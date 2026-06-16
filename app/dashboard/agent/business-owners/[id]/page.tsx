import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  LockKeyhole,
  Star,
} from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

type KycTierRow = {
  label: string;
  href: string;
  status: "complete" | "pending" | "locked";
  processingTime?: string;
  featured?: boolean;
};

function statusIcon(status: KycTierRow["status"]) {
  if (status === "complete") {
    return <CheckCircle2 size={16} className="text-[#13A83B]" />;
  }
  if (status === "pending") {
    return <Clock size={16} className="text-[#FE6E00]" />;
  }
  return <LockKeyhole size={16} className="text-[#9CA3AF]" />;
}

export default async function AgentBusinessOwnerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);
  const isBuyer = owner.businessType === "Buyer";
  const currentTierLabel = isBuyer ? "Basic Buyer" : "Registered Seller";
  const tiers: KycTierRow[] = isBuyer
    ? [
        {
          label: "Basic Buyer",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/basic-buyer`,
          status: "complete",
        },
        {
          label: "Verified Buyer",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/verified-buyer`,
          status: "complete",
          processingTime: "24-48 hours",
        },
        {
          label: "Business Buyer",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/business-buyer`,
          status: "pending",
          processingTime: "24-48 hours",
        },
      ]
    : [
        {
          label: "Basic Seller",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/basic-seller`,
          status: "complete",
        },
        {
          label: "Registered Seller",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/registered-seller`,
          status: "complete",
        },
        {
          label: "ID Verified",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/id-verified`,
          status: "complete",
          processingTime: "24-48 hours",
        },
        {
          label: "Business Verified",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/business-verified`,
          status: "pending",
          processingTime: "48 hours",
        },
        {
          label: "Premium Seller",
          href: `/dashboard/agent/business-owners/${owner.id}/kyc/tier/premium-seller`,
          status: "locked",
          processingTime: "3 - 5 days",
          featured: true,
        },
      ];

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="KYC & Verification">
      <section className="rounded-xl border border-[#DDE2EA] bg-white p-3 md:p-4">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Account Tiers
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[#6B7280]">
              The higher your account tiers, the higher your privileges/benefit as a buyer.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <span className="inline-flex items-center gap-2 text-sm text-[#111827]">
              {currentTierLabel}
              <CheckCircle2 size={16} className="text-[#0D7CF2]" />
            </span>
            <button
              type="button"
              className="h-9 rounded-lg bg-[#0669D9] px-5 text-sm font-medium text-white md:min-w-[108px]"
            >
              Upgrade
            </button>
          </div>
        </div>
      </section>

        <ul className="space-y-4">
          {tiers.map((tier) => (
            <li
              key={tier.label}
              className="flex min-h-[68px] items-center justify-between gap-3 rounded-lg bg-white px-3 py-4 md:min-h-[70px]"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[#111827]">
                <span className="font-medium">{tier.label}</span>
                {tier.featured ? (
                  <Star size={16} className="text-[#F59E0B]" />
                ) : (
                  statusIcon(tier.status)
                )}
                {tier.processingTime ? (
                  <span className="text-xs text-[#111827]">
                    (Processing time {tier.processingTime})
                  </span>
                ) : null}
              </div>
              <Link
                href={tier.href}
                className="hidden shrink-0 items-center gap-4 text-sm font-medium text-[#111827] hover:text-[#0669D9] md:inline-flex"
              >
                See details
                <ChevronRight size={20} />
              </Link>
            </li>
          ))}
        </ul>
    </OwnerDetailShell>
  );
}
