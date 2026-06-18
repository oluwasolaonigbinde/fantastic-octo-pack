"use client";

import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout";

const TABS = [
  { id: "returns", label: "Returns & Refunds" },
  { id: "shipping", label: "Shipping" },
  { id: "acceptable-use", label: "Acceptable Use" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-2 text-lg font-semibold text-[#06285F] first:mt-0">
      {children}
    </h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-7 text-[#374151]">{children}</div>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item} className="list-disc text-[15px] leading-7 text-[#374151]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReturnsPolicy() {
  return (
    <Prose>
      <SectionHeading>1. Escrow Protection</SectionHeading>
      <p>BAIY operates an escrow-based payment system.</p>
      <BulletList
        items={[
          "Customer payments are held securely until delivery is confirmed and the dispute review period has expired.",
          "Funds held in escrow are maintained pending release to the seller or refund to the buyer.",
        ]}
      />

      <SectionHeading>2. Dispute Window</SectionHeading>
      <p>
        Buyers have <strong>twenty-four (24) hours</strong> after confirmed delivery to raise a dispute
        regarding an order. Disputes submitted after this period may not be eligible for review.
      </p>

      <SectionHeading>3. Eligible Refund Situations</SectionHeading>
      <p>A buyer may be eligible for a refund if:</p>
      <BulletList
        items={[
          "The product was not delivered.",
          "The wrong product was delivered.",
          "The product is materially different from its listing description.",
          "The product arrives significantly damaged.",
          "The product is determined to be counterfeit or misrepresented.",
        ]}
      />

      <SectionHeading>4. Non-Eligible Refund Situations</SectionHeading>
      <p>Refunds may not be granted where:</p>
      <BulletList
        items={[
          "The buyer changes their mind after purchase.",
          "The buyer fails to raise a dispute within the applicable review period.",
          "A used or refurbished product was accurately described and disclosed by the seller.",
          "Normal wear, maintenance requirements, or post-delivery issues arise after successful completion of the transaction.",
        ]}
      />

      <SectionHeading>5. Dispute Resolution</SectionHeading>
      <p>Disputes may require supporting evidence, including:</p>
      <BulletList items={["Photographs.", "Videos.", "Delivery records.", "Communication records.", "Other relevant documentation."]} />
      <p className="mt-3">
        BAIY administrators will review submitted evidence and determine the outcome of the dispute.
        The decision of BAIY regarding escrow release or refund shall be final.
      </p>

      <SectionHeading>6. Escrow Release</SectionHeading>
      <BulletList
        items={[
          "Where no dispute is raised within the review period, escrow funds will be released to the seller.",
          "Where a dispute is resolved in favor of the buyer, eligible funds may be refunded to the buyer.",
        ]}
      />

      <SectionHeading>7. Seller Cancellations</SectionHeading>
      <BulletList
        items={[
          "Sellers may cancel an order before fulfillment begins.",
          "If an order is cancelled before fulfillment, any collected funds will be returned to the buyer.",
        ]}
      />
    </Prose>
  );
}

function ShippingPolicy() {
  return (
    <Prose>
      <SectionHeading>1. Overview</SectionHeading>
      <p>
        BAIY is a marketplace connecting buyers and verified distributors and manufacturers. Depending
        on the product category and transaction type, shipping may be handled either by BAIY or
        directly by the seller.
      </p>

      <SectionHeading>2. Seller Fulfillment</SectionHeading>
      <p>For seller-fulfilled orders, sellers are responsible for:</p>
      <BulletList
        items={[
          "Packaging products appropriately.",
          "Arranging shipment.",
          "Providing accurate delivery information.",
          "Delivering products that match the listing description.",
        ]}
      />

      <SectionHeading>3. BAIY Logistics Support</SectionHeading>
      <p>
        For selected products and categories, BAIY may coordinate or facilitate logistics services.
        Where BAIY facilitates logistics, such assistance does not transfer ownership of goods to BAIY
        and does not make BAIY the seller of record.
      </p>

      <SectionHeading>4. Delivery Confirmation</SectionHeading>
      <p>An order is considered delivered when:</p>
      <BulletList
        items={[
          "The buyer confirms receipt; or",
          "Reasonable evidence of delivery is available.",
        ]}
      />
      <p className="mt-3">
        Upon delivery confirmation, the buyer's dispute review period begins.
      </p>

      <SectionHeading>5. Failed Deliveries</SectionHeading>
      <p>
        If a product is not delivered and the seller cannot provide evidence of shipment or delivery,
        the transaction may be cancelled and the buyer may be eligible for a refund.
      </p>

      <SectionHeading>6. Shipping Delays</SectionHeading>
      <p>
        Delivery times are estimates only and may be affected by circumstances outside the control of
        BAIY or the seller.
      </p>

      <SectionHeading>7. Risk of Loss</SectionHeading>
      <p>
        Responsibility for loss or damage during shipment will be assessed during dispute review and
        based on available evidence from both parties.
      </p>
    </Prose>
  );
}

function AcceptableUsePolicy() {
  return (
    <Prose>
      <SectionHeading>1. Purpose</SectionHeading>
      <p>
        This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs the use of the BAIY marketplace by buyers,
        distributors, OEMs, and other users. By using BAIY, you agree to comply with this policy and
        all applicable laws and regulations.
      </p>

      <SectionHeading>2. Prohibited Activities</SectionHeading>
      <p>Users may not:</p>
      <BulletList
        items={[
          "Submit false or misleading information during registration or verification.",
          "Create fake accounts or impersonate another person or business.",
          "Engage in fraudulent, deceptive, or unlawful activity.",
          "Circumvent BAIY's escrow process.",
          "Solicit or encourage off-platform payments for transactions initiated through BAIY.",
          "Manipulate reviews, ratings, or transaction records.",
          "Interfere with the operation or security of the platform.",
          "Use automated systems to scrape, copy, or abuse marketplace data.",
        ]}
      />

      <SectionHeading>3. Prohibited Products</SectionHeading>
      <p>The following products are prohibited from being listed, sold, or advertised on BAIY:</p>
      <BulletList
        items={[
          "Illegal products or services.",
          "Counterfeit or stolen goods.",
          "Weapons, firearms, ammunition, and explosives.",
          "Controlled substances or illegal drugs.",
          "Adult content or sexually explicit products.",
          "Hazardous or dangerous materials prohibited by law.",
          "Financial products, investment schemes, or unlicensed financial services.",
          "Cryptocurrency-related products where prohibited by applicable law.",
          "Any product that violates intellectual property rights.",
          "Any product prohibited by local, national, or international laws.",
        ]}
      />
      <p className="mt-3">BAIY reserves the right to remove listings that violate this policy.</p>

      <SectionHeading>4. Seller Responsibilities</SectionHeading>
      <p>Sellers must:</p>
      <BulletList
        items={[
          "Accurately describe all products offered for sale.",
          "Disclose whether an item is new, used, refurbished, or reconditioned.",
          "Maintain accurate inventory information.",
          "Fulfill orders in a timely manner.",
          "Cooperate with dispute investigations.",
        ]}
      />

      <SectionHeading>5. Marketplace Enforcement</SectionHeading>
      <p>
        BAIY may suspend, restrict, remove, or terminate any account that violates this policy. BAIY
        may also remove listings, withhold marketplace privileges, or take other actions necessary to
        protect users and the integrity of the platform.
      </p>

      <SectionHeading>6. Changes to this Policy</SectionHeading>
      <p>
        BAIY may update this policy from time to time. Continued use of the platform constitutes
        acceptance of any updates.
      </p>
    </Prose>
  );
}

const POLICY_CONTENT: Record<TabId, { title: string; updated: string; content: React.ReactNode }> = {
  returns: {
    title: "Returns & Refund Policy",
    updated: "June 2026",
    content: <ReturnsPolicy />,
  },
  shipping: {
    title: "Shipping Policy",
    updated: "June 2026",
    content: <ShippingPolicy />,
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    updated: "June 2026",
    content: <AcceptableUsePolicy />,
  },
};

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("returns");
  const active = POLICY_CONTENT[activeTab];

  useEffect(() => {
    const hash = window.location.hash.slice(1) as TabId;
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash);
  }, []);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <PublicLayout>
      <div className="bg-[#F8FAFC] min-h-[60vh]">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#06285F] lg:text-4xl">Policies</h1>
            <p className="mt-2 text-[15px] text-[#6B7280]">
              Please review the policies that govern the use of the BAIY marketplace.
            </p>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* Sidebar / horizontal tabs */}
            <aside className="shrink-0 lg:w-[220px]">
              <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-x-visible lg:px-0 lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition lg:w-full ${
                      activeTab === tab.id
                        ? "bg-[#06285F] text-white shadow-sm"
                        : "bg-white text-[#374151] hover:bg-[#EFF6FF] hover:text-[#06285F] border border-[#E5E7EB]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Policy content */}
            <div className="flex-1">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm lg:p-10">
                <div className="mb-6 border-b border-[#F3F4F6] pb-5">
                  <h2 className="text-2xl font-bold text-[#06285F]">{active.title}</h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]">Last Updated: {active.updated}</p>
                </div>
                {active.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
