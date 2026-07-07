"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Flag,
  Info,
  Lock,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import Header from "../../../component/header";
import { Skeleton } from "@/components/base";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { AddDisputeResponse } from "@/components/disputes/AddDisputeResponse";
import { DisputeActivityTimeline } from "@/components/disputes/DisputeActivityTimeline";
import { useOrderDispute } from "@/hooks/useOrderDisputes";
import {
  useRequestOrderDisputeEvidenceMutation,
  useResolveOrderDisputeMutation,
} from "@/hooks/queries/order-disputes";
import { getOrderDisplayId } from "@/constants/demoBuyerOrders";
import { formatNaira } from "@/lib/wallet-format";
import {
  buildDisputeActivity,
  getDisputeAmount,
  getDisputeBuyerAvatar,
  getDisputeBuyerName,
  getDisputeDisplayId,
  getDisputeOrder,
  getDisputeProductImage,
  getDisputeProductName,
  getDisputeSellerAvatar,
  getDisputeSellerName,
} from "@/lib/order-dispute-presenter";
import type {
  OrderDispute,
  OrderDisputeInventoryAction,
  OrderDisputeResolutionOutcome,
} from "@/types/order-dispute";
import { UserRole } from "@/types/user";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatDate = (value: string | undefined) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

function SummaryDivider() {
  return <div className="hidden h-[56px] w-px bg-[#DDE0E5] xl:block" />;
}

function SummaryRow({ dispute }: { dispute: OrderDispute }) {
  const order = getDisputeOrder(dispute);
  const productImage = getDisputeProductImage(dispute);
  const buyerAvatar = getDisputeBuyerAvatar(dispute);
  const sellerAvatar = getDisputeSellerAvatar(dispute);

  return (
    <section className="grid gap-5 rounded-2xl border border-[#DDE0E5] bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-center xl:justify-between">
      <div>
        <p className="text-sm text-[#6B7280]">Order ID</p>
        <p className="mt-2 text-base font-semibold text-[#111827]">
          {getOrderDisplayId(
            order?._id ??
              (typeof dispute.order === "string" ? dispute.order : undefined),
          )}
        </p>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Product</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6]">
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImage}
                alt={getDisputeProductName(dispute)}
                className="size-full object-cover"
              />
            ) : null}
          </span>
          <p className="text-base font-semibold text-[#111827]">
            {getDisputeProductName(dispute)}
          </p>
        </div>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Amount</p>
        <p className="mt-2 text-base font-semibold text-[#111827]">
          {formatNaira(getDisputeAmount(dispute))}
        </p>
        <p className="text-sm text-[#6B7280]">Escrow Payment</p>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Buyer</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE0E5]">
            {buyerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={buyerAvatar}
                alt={getDisputeBuyerName(dispute)}
                className="size-full object-cover"
              />
            ) : null}
          </span>
          <div>
            <p className="text-base font-semibold text-[#111827]">
              {getDisputeBuyerName(dispute)}
            </p>
            <p className="text-sm text-[#6B7280]">Buyer</p>
          </div>
        </div>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Seller (Distributor)</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE0E5]">
            {sellerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sellerAvatar}
                alt={getDisputeSellerName(dispute)}
                className="size-full object-cover"
              />
            ) : null}
          </span>
          <div>
            <p className="text-base font-semibold text-[#111827]">
              {getDisputeSellerName(dispute)}
            </p>
            <p className="text-sm text-[#6B7280]">Distributor</p>
          </div>
        </div>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Case Handler</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DDE0E5] text-[#6B7280]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-base font-semibold text-[#111827]">Support Team</p>
            <p className="text-sm text-[#6B7280]">Admin</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DisputeOverviewCard({ dispute }: { dispute: OrderDispute }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = dispute.description.length > 160;
  const text =
    expanded || !isLong
      ? dispute.description
      : `${dispute.description.slice(0, 160)}…`;

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#FFE3DD] text-[#E33C13]">
          <Flag size={15} />
        </span>
        <h2 className="text-base font-semibold text-[#111827]">Dispute Overview</h2>
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#8A94A6]">
        Reason
      </p>
      <span className="mt-2 inline-flex rounded-lg bg-[#FFE3DD] px-3 py-1 text-xs font-medium text-[#E33C13]">
        {dispute.reason}
      </span>

      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#8A94A6]">
        Buyer&apos;s message
      </p>
      <p className="mt-2 whitespace-pre-line text-sm italic leading-6 text-[#4B5563]">
        &ldquo;{text}&rdquo;
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0669D9]"
        >
          {expanded ? "View less" : "View full message"}
          <ChevronDown
            size={15}
            className={expanded ? "rotate-180 transition" : "transition"}
          />
        </button>
      ) : null}
    </section>
  );
}

function ParticipantsCard({ dispute }: { dispute: OrderDispute }) {
  const buyerAvatar = getDisputeBuyerAvatar(dispute);
  const sellerAvatar = getDisputeSellerAvatar(dispute);
  const buyerName = getDisputeBuyerName(dispute);
  const sellerName = getDisputeSellerName(dispute);

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-base font-semibold text-[#111827]">Dispute Participants</h2>
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] p-3">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0669D9] text-sm font-semibold text-white">
            {buyerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={buyerAvatar}
                alt={buyerName}
                className="size-full object-cover"
              />
            ) : (
              buyerName.slice(0, 2).toUpperCase()
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{buyerName}</p>
            <p className="text-xs text-[#6B7280]">Buyer</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] p-3">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#166534] text-sm font-semibold text-white">
            {sellerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="size-full object-cover"
              />
            ) : (
              sellerName.slice(0, 2).toUpperCase()
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{sellerName}</p>
            <p className="text-xs text-[#6B7280]">Distributor (Seller)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseActionsCard({
  resolved,
  onConfirmResolution,
  onMarkResolved,
  busy,
}: {
  resolved: boolean;
  onConfirmResolution: () => void;
  onMarkResolved: () => void;
  busy: boolean;
}) {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-base font-semibold text-[#111827]">Case Actions</h2>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={onConfirmResolution}
          disabled={resolved || busy}
          className="w-full rounded-xl border border-[#017BED] bg-[#EAF3FF] p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#017BED]">
            <ShieldCheck size={16} />
            Confirm Resolution
          </span>
          <span className="mt-1 block text-xs text-[#6B7280]">
            Allocate escrow funds between buyer and seller to resolve this
            dispute.
          </span>
        </button>

        <button
          type="button"
          onClick={onMarkResolved}
          disabled={resolved || busy}
          className="w-full rounded-xl border border-[#DDE0E5] p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#017BED]">
            <CheckCircle2 size={16} />
            Mark as Resolved
          </span>
          <span className="mt-1 block text-xs text-[#6B7280]">
            Mark the case as resolved.
          </span>
        </button>
      </div>
    </section>
  );
}

function CaseSummaryCard({ dispute }: { dispute: OrderDispute }) {
  const resolved = dispute.status === "resolved";
  const escrowStatus = resolved
    ? dispute.resolutionOutcome === "refund_buyer"
      ? "Refunded"
      : dispute.resolutionOutcome === "release_to_seller"
        ? "Released"
        : dispute.resolutionOutcome === "split_funds"
          ? "Split"
          : "Closed"
    : "On Hold";

  const rows: Array<{ label: string; value: string; tone?: string; icon?: boolean }> = [
    {
      label: "Status",
      value: resolved ? "Resolved" : "In Dispute",
      tone: resolved ? "text-[#16A34A]" : "text-[#E33C13]",
    },
    { label: "Escrow Status", value: escrowStatus, icon: true },
    { label: "Escrow Held", value: formatNaira(getDisputeAmount(dispute)) },
    { label: "Created", value: formatDate(dispute.createdAt) },
    { label: "Last Updated", value: formatDate(dispute.updatedAt) },
    { label: "SLA", value: "24 - 48 hours" },
  ];

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-base font-semibold text-[#111827]">Case Summary</h2>
      <dl className="mt-4 space-y-4 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4 last:border-0 last:pb-0"
          >
            <dt className="text-[#8A94A6]">{row.label}</dt>
            <dd
              className={`inline-flex items-center gap-1 text-right font-medium ${row.tone ?? "text-[#111827]"}`}
            >
              {row.icon ? <Lock size={13} className="text-[#8A94A6]" /> : null}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const INVENTORY_ACTIONS: Array<{
  value: OrderDisputeInventoryAction;
  title: string;
  describe: (sellerName: string) => string;
}> = [
  {
    value: "release",
    title: "Return stock to distributor",
    describe: (sellerName) =>
      `Return the reserved units to ${sellerName}'s available inventory — use this if the item is going back to them.`,
  },
  {
    value: "consume",
    title: "Count stock as sold",
    describe: (sellerName) =>
      `Finalize the reserved units as a completed sale for ${sellerName} — use this if the item stays with the buyer.`,
  },
  {
    value: "none",
    title: "Leave stock reserved",
    describe: () =>
      "Don't change the order's reserved stock — decide on the inventory separately.",
  },
];

function ConfirmResolutionDrawer({
  dispute,
  open,
  onClose,
  onConfirm,
  busy,
  error,
}: {
  dispute: OrderDispute;
  open: boolean;
  onClose: () => void;
  onConfirm: (args: {
    buyerAmount: number;
    sellerAmount: number;
    inventoryAction: OrderDisputeInventoryAction;
    note: string;
  }) => void;
  busy: boolean;
  error: string;
}) {
  const total = getDisputeAmount(dispute);
  const [buyerAmount, setBuyerAmount] = useState(0);
  const [note, setNote] = useState("");
  const [inventoryAction, setInventoryAction] =
    useState<OrderDisputeInventoryAction>("release");
  const sellerAmount = Math.max(0, total - buyerAmount);

  // Reset the allocation each time the drawer transitions to open — done during
  // render (React's recommended pattern) rather than in an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBuyerAmount(0);
      setNote("");
      setInventoryAction("release");
    }
  }

  const clamp = (value: number) =>
    Number.isFinite(value) ? Math.min(Math.max(value, 0), total) : 0;

  const buyerPct = total > 0 ? Math.round((buyerAmount / total) * 100) : 0;
  const sellerPct = total > 0 ? 100 - buyerPct : 0;

  const buyerName = getDisputeBuyerName(dispute);
  const sellerName = getDisputeSellerName(dispute);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#EEF2F7] px-6 py-5">
          <h2 className="text-lg font-semibold text-[#111827]">Confirm Resolution</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="flex items-start gap-3 rounded-xl bg-[#EAF3FF] p-4 text-sm text-[#0669D9]">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              You are about to allocate the escrow funds between the buyer and seller.
            </p>
          </div>

          <div className="rounded-xl bg-[#F3F8FF] p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8A94A6]">
              Escrow Held
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {formatNaira(total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827]">
              Allocate to Buyer ({buyerName})
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-[#DDE0E5] px-4">
              <span className="text-base text-[#6B7280]">₦</span>
              <input
                type="number"
                min={0}
                max={total}
                value={buyerAmount === 0 ? "" : buyerAmount}
                onChange={(event) =>
                  setBuyerAmount(clamp(Number(event.target.value)))
                }
                placeholder="0.00"
                className="h-12 w-full bg-transparent px-2 text-base text-[#111827] outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-[#8A94A6]">
              Available: {formatNaira(total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827]">
              Allocate to Seller ({sellerName})
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-[#DDE0E5] px-4">
              <span className="text-base text-[#6B7280]">₦</span>
              <input
                type="number"
                min={0}
                max={total}
                value={sellerAmount === 0 ? "" : sellerAmount}
                onChange={(event) =>
                  setBuyerAmount(clamp(total - clamp(Number(event.target.value))))
                }
                placeholder="0.00"
                className="h-12 w-full bg-transparent px-2 text-base text-[#111827] outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-[#8A94A6]">
              Available: {formatNaira(total)}
            </p>
          </div>

          <div className="rounded-xl border border-[#DDE0E5] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A94A6]">
              Allocation Summary
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#4B5563]">To Buyer</span>
                <span className="font-medium text-[#111827]">
                  {formatNaira(buyerAmount)}{" "}
                  <span className="text-[#8A94A6]">({buyerPct}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4B5563]">To Seller</span>
                <span className="font-medium text-[#111827]">
                  {formatNaira(sellerAmount)}{" "}
                  <span className="text-[#8A94A6]">({sellerPct}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                <span className="text-base font-semibold text-[#111827]">
                  Total Allocated
                </span>
                <span className="text-base font-semibold text-[#111827]">
                  {formatNaira(total)}{" "}
                  <span className="text-sm text-[#16A34A]">(100%)</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827]">
              Reserved Stock ({sellerName}&apos;s inventory)
            </label>
            <div className="mt-2 space-y-2">
              {INVENTORY_ACTIONS.map((action) => {
                const active = inventoryAction === action.value;
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setInventoryAction(action.value)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#017BED] bg-[#F3F8FF]"
                        : "border-[#DDE0E5] hover:border-[#C4C8CE]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        active ? "border-[#017BED]" : "border-[#C4C8CE]"
                      }`}
                    >
                      {active ? (
                        <span className="size-2 rounded-full bg-[#017BED]" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#111827]">
                        {action.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#6B7280]">
                        {action.describe(sellerName)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827]">
              Resolution Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note about this resolution for the audit log…"
              className="mt-2 min-h-[110px] w-full resize-none rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>

          {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
        </div>

        <div className="flex items-center gap-3 border-t border-[#EEF2F7] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-[#DDE0E5] text-sm font-medium text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({ buyerAmount, sellerAmount, inventoryAction, note })
            }
            disabled={busy || total <= 0}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
          >
            <Lock size={15} />
            {busy ? "Processing…" : "Confirm Allocation"}
          </button>
        </div>
      </aside>
    </div>
  );
}

const RESOLUTION_OPTIONS: Array<{
  value: OrderDisputeResolutionOutcome;
  title: string;
  describe: (amount: string) => string;
}> = [
  {
    value: "release_to_seller",
    title: "Release to Seller",
    describe: (amount) => `Release the full escrow (${amount}) to the distributor.`,
  },
  {
    value: "refund_buyer",
    title: "Refund Buyer",
    describe: (amount) => `Return the full escrow (${amount}) to the buyer.`,
  },
  {
    value: "closed_after_dispute",
    title: "Close after dispute",
    describe: () => "Close the case without moving escrow funds.",
  },
];

function ResolveDisputeModal({
  dispute,
  open,
  onClose,
  onConfirm,
  busy,
  error,
}: {
  dispute: OrderDispute;
  open: boolean;
  onClose: () => void;
  onConfirm: (args: {
    outcome: OrderDisputeResolutionOutcome;
    note: string;
  }) => void;
  busy: boolean;
  error: string;
}) {
  const [outcome, setOutcome] =
    useState<OrderDisputeResolutionOutcome>("release_to_seller");
  const [note, setNote] = useState("");

  // Reset the selection whenever the modal transitions to open (render-time
  // pattern, avoids a setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOutcome("release_to_seller");
      setNote("");
    }
  }

  if (!open) {
    return null;
  }

  const amount = formatNaira(getDisputeAmount(dispute));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[460px] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#EEF2F7] px-6 py-5">
          <h2 className="text-lg font-semibold text-[#111827]">Resolve Dispute</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm text-[#4B5563]">
            Choose how to resolve this dispute. This decides how the escrow of{" "}
            <span className="font-semibold text-[#111827]">{amount}</span> is handled.
          </p>

          <div className="space-y-3">
            {RESOLUTION_OPTIONS.map((option) => {
              const active = outcome === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setOutcome(option.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-[#017BED] bg-[#F3F8FF]"
                      : "border-[#DDE0E5] hover:border-[#C4C8CE]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-[#017BED]" : "border-[#C4C8CE]"
                    }`}
                  >
                    {active ? (
                      <span className="size-2.5 rounded-full bg-[#017BED]" />
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#111827]">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#6B7280]">
                      {option.describe(amount)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827]">
              Resolution Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note about this resolution for the audit log…"
              className="mt-2 min-h-[90px] w-full resize-none rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>

          {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
        </div>

        <div className="flex items-center gap-3 border-t border-[#EEF2F7] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-[#DDE0E5] text-sm font-medium text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ outcome, note })}
            disabled={busy}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Resolving…" : "Confirm Resolution"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.disputeId as string;
  const { dispute: loadedDispute, isLoading, isError, message } =
    useOrderDispute(disputeId);

  const dispute = loadedDispute?._id === disputeId ? loadedDispute : null;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Pin the activity feed's height to the left column (Dispute Overview +
  // Participants) so it ends on the same line and scrolls internally.
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [feedHeight, setFeedHeight] = useState<number | undefined>(undefined);

  const resolveMutation = useResolveOrderDisputeMutation();
  const requestEvidenceMutation = useRequestOrderDisputeEvidenceMutation();

  const resolved = dispute?.status === "resolved";

  const activity = useMemo(
    () =>
      dispute ? buildDisputeActivity(dispute, { viewerRole: "seller" }) : [],
    [dispute],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const element = leftColumnRef.current;
    if (!element) return;
    const update = () => setFeedHeight(element.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [dispute]);

  const contactParty = (party: OrderDispute["buyer"]) => {
    const partyId = typeof party === "object" ? party._id : undefined;
    router.push(
      partyId
        ? `/dashboard/admin/messaging?to=${partyId}`
        : "/dashboard/admin/messaging",
    );
  };

  const handleConfirmAllocation = async ({
    buyerAmount,
    sellerAmount,
    inventoryAction,
    note,
  }: {
    buyerAmount: number;
    sellerAmount: number;
    inventoryAction: OrderDisputeInventoryAction;
    note: string;
  }) => {
    if (!dispute) return;
    setActionError("");

    try {
      await resolveMutation.mutateAsync({
        disputeId: dispute._id,
        payload: {
          resolutionOutcome: "split_funds",
          buyerAmount,
          sellerAmount,
          inventoryAction,
          ...(note.trim() ? { resolutionNote: note.trim() } : {}),
        },
      });
      setDrawerOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to confirm allocation.",
      );
    }
  };

  const handleResolveDispute = async ({
    outcome,
    note,
  }: {
    outcome: OrderDisputeResolutionOutcome;
    note: string;
  }) => {
    if (!dispute) return;
    setActionError("");
    try {
      await resolveMutation.mutateAsync({
        disputeId: dispute._id,
        payload: {
          resolutionOutcome: outcome,
          ...(note.trim() ? { resolutionNote: note.trim() } : {}),
        },
      });
      setResolveModalOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to resolve the dispute.",
      );
    }
  };

  const handleRequestEvidence = async () => {
    if (!dispute) return;
    setActionError("");
    setMoreOpen(false);
    try {
      await requestEvidenceMutation.mutateAsync({ disputeId: dispute._id });
      setActionNotice("Requested additional evidence from the parties.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to request evidence.",
      );
    }
  };

  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <Header title="Disputes" description="View and track all disputes" />

        <main className="space-y-5 bg-[#F9FAFB] p-4 md:p-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/disputes")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>

          {isLoading && !dispute ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          ) : isError || !dispute ? (
            <div className="rounded-2xl border border-[#DDE0E5] bg-white p-10 text-center">
              <p className="text-sm text-[#6B7280]">
                {message || "We couldn't load this dispute. Please try again."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold text-[#111827]">
                      My Dispute: {getDisputeDisplayId(dispute._id)}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${
                        resolved
                          ? "bg-[#DCFCE7] text-[#16A34A]"
                          : "bg-[#DCFCE7] text-[#16A34A]"
                      }`}
                    >
                      {resolved ? "Resolved" : "In Dispute"}
                      <span className="size-2 rounded-full bg-current" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Opened on {formatDateTime(dispute.createdAt)}
                    {!resolved ? (
                      <span className="ml-2 text-[#E33C13]">
                        • SLA: 24 - 48 hours
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => contactParty(dispute.buyer)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#017BED] px-4 text-sm font-medium text-[#017BED]"
                  >
                    Contact Buyer
                    <MessageCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => contactParty(dispute.seller)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#017BED] px-4 text-sm font-medium text-[#017BED]"
                  >
                    Contact Seller
                    <MessageCircle size={16} />
                  </button>
                  <div className="relative" ref={moreRef}>
                    <button
                      type="button"
                      onClick={() => setMoreOpen((value) => !value)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white"
                    >
                      More Actions
                      <ChevronDown size={16} />
                    </button>
                    {moreOpen ? (
                      <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-[#DDE0E5] bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => void handleRequestEvidence()}
                          disabled={resolved || requestEvidenceMutation.isPending}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-50"
                        >
                          Request more evidence
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <SummaryRow dispute={dispute} />

              {actionError ? (
                <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
                  {actionError}
                </div>
              ) : null}
              {actionNotice ? (
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm text-[#1D4ED8]">
                  {actionNotice}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px] lg:items-start">
                <div ref={leftColumnRef} className="space-y-4">
                  <DisputeOverviewCard dispute={dispute} />
                  <ParticipantsCard dispute={dispute} />
                </div>

                <div className="flex flex-col gap-4">
                  <div
                    style={
                      {
                        "--feed-h": feedHeight ? `${feedHeight}px` : "auto",
                      } as CSSProperties
                    }
                    className="min-h-0 lg:h-[var(--feed-h)]"
                  >
                    <DisputeActivityTimeline events={activity} fill />
                  </div>
                  {!resolved ? <AddDisputeResponse disputeId={dispute._id} /> : null}
                </div>

                <div className="space-y-4">
                  <CaseActionsCard
                    resolved={resolved}
                    busy={resolveMutation.isPending}
                    onConfirmResolution={() => {
                      setActionNotice("");
                      setDrawerOpen(true);
                    }}
                    onMarkResolved={() => {
                      setActionNotice("");
                      setResolveModalOpen(true);
                    }}
                  />
                  <CaseSummaryCard dispute={dispute} />
                </div>
              </div>

              <section className="flex items-start gap-3 rounded-2xl border border-[#86EFAC] bg-[#F0FDF4] p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    Escrow is automatically paused when a dispute is raised.
                  </p>
                  <p className="mt-1 text-sm text-[#4B5563]">
                    Funds will remain on hold until the dispute is resolved through
                    admin mediation or party agreement.
                  </p>
                </div>
              </section>

              <ConfirmResolutionDrawer
                dispute={dispute}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onConfirm={handleConfirmAllocation}
                busy={resolveMutation.isPending}
                error={actionError}
              />

              <ResolveDisputeModal
                dispute={dispute}
                open={resolveModalOpen}
                onClose={() => setResolveModalOpen(false)}
                onConfirm={handleResolveDispute}
                busy={resolveMutation.isPending}
                error={actionError}
              />
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
