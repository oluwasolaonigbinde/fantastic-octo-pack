import { FileText } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string; tier: string }>;
}

const tierLabels: Record<string, string> = {
  "basic-seller": "Basic Seller",
  "registered-seller": "Registered Seller",
  "id-verified": "ID Verified",
  "business-verified": "Business Verified",
  "premium-seller": "Premium Seller",
  "basic-buyer": "Basic Buyer",
  "verified-buyer": "Verified Buyer",
  "business-buyer": "Business Buyer",
};

const submittedFields = [
  ["Business name", "The name of business"],
  ["Email address", "example001@gmail.com"],
  ["Phone number", "08184318676"],
  ["Address", "12 Marin a Rd, Lagos"],
  ["State", "Lagos"],
  ["Country", "Nigeria"],
];

export default async function AgentBusinessOwnerKycTierPage({ params }: PageProps) {
  const { id, tier } = await params;
  const owner = getOwnerForId(id);
  const tierLabel = tierLabels[tier] ?? "KYC Entries";

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="KYC & Verification">
      <section className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#111827]">{tierLabel} Entries</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            View all information submitted for this account tier.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-[#F3F4F6]">
            <div className="grid grid-cols-1 border-b border-[#F3F4F6] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#6B7280] sm:grid-cols-2">
              <span>Field</span>
              <span>Submitted information</span>
            </div>
            {submittedFields.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-1 border-b border-[#F3F4F6] px-4 py-4 text-sm last:border-b-0 sm:grid-cols-2"
              >
                <span className="text-[#6B7280]">{label}</span>
                <span className="font-medium text-[#111827]">{value}</span>
              </div>
            ))}
          </div>

          <aside className="space-y-3 rounded-xl border border-[#F3F4F6] p-4">
            <h3 className="text-base font-semibold text-[#111827]">Documents</h3>
            {["Business registration.pdf", "Government ID.pdf", "Utility bill.pdf"].map(
              (document) => (
                <div
                  key={document}
                  className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-3 py-3"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm text-[#374151]">
                    <FileText size={16} className="text-[#0669D9]" />
                    <span className="truncate">{document}</span>
                  </span>
                  <button type="button" className="text-sm font-medium text-[#0669D9]">
                    View
                  </button>
                </div>
              ),
            )}
          </aside>
        </div>
      </section>
    </OwnerDetailShell>
  );
}
