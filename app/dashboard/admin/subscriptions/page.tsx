"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Hourglass,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import Header from "../../component/header";
import {
  Button,
  Drawer,
  Input,
  SingleSelect,
  Spinner,
  SummaryCard,
  Switch,
} from "@/components/base";
import { Dialog, DialogContent } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import PlansPanel from "./plans-panel";
import LibraryPanel from "./library-panel";
import subscriptionService from "@/services/subscriptionService";
import type {
  PlanFeature,
  Subscription,
  SubscriptionPage,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types/subscription";

const PAGE_SIZE = 10;

const TABS = [
  { key: "subscribers", label: "Subscribers" },
  { key: "plans", label: "Plans" },
  { key: "library", label: "Library" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Statuses we surface in the filter + count cards (matches the API enum). */
const STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "past_due", label: "Past Due" },
  { value: "canceled", label: "Canceled" },
  { value: "expired", label: "Expired" },
];

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[#E8FAEE] text-[#13A83B]" },
  pending: { label: "Pending", className: "bg-[#FFF5DB] text-[#B07A00]" },
  past_due: { label: "Past Due", className: "bg-[#FDE8E8] text-[#D92D20]" },
  canceled: { label: "Canceled", className: "bg-[#F2F4F7] text-[#667085]" },
  expired: { label: "Expired", className: "bg-[#F2F4F7] text-[#667085]" },
};

// ─── Formatting helpers ──────────────────────────────────────────────────────

/** Amounts are stored in kobo; render as naira. */
const formatNaira = (kobo?: number | null) =>
  `₦${((kobo ?? 0) / 100).toLocaleString("en-NG")}`;

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const titleCase = (value?: string | null) => {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const ownerName = (sub: Subscription) => {
  const owner = sub.owner;
  if (!owner) return "Unknown subscriber";
  const name = `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim();
  return name || owner.email || "Unknown subscriber";
};

const ownerInitials = (sub: Subscription) => {
  const name = ownerName(sub);
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]).join("");
  return (initials || "?").toUpperCase();
};

const userTypeLabel = (sub: Subscription) =>
  titleCase(sub.ownerType ?? sub.owner?.role);

const planNameOf = (sub: Subscription) => {
  if (sub.planSnapshot?.name) return sub.planSnapshot.name;
  if (typeof sub.plan === "object" && sub.plan) return sub.plan.name;
  return "—";
};

const planPriceOf = (sub: Subscription) => {
  if (sub.planSnapshot) return sub.planSnapshot.price;
  if (typeof sub.plan === "object" && sub.plan) return sub.plan.price;
  return 0;
};

const billingLabel = (sub: Subscription) => {
  const interval = sub.planSnapshot?.interval ?? (typeof sub.plan === "object" ? sub.plan?.interval : undefined);
  const count = sub.planSnapshot?.intervalCount ?? (typeof sub.plan === "object" ? sub.plan?.intervalCount : 1) ?? 1;
  if (!interval) return "—";
  if (count > 1) return `Every ${count} ${interval === "yearly" ? "years" : "months"}`;
  return interval === "yearly" ? "Annual" : "Monthly";
};

const planIdOf = (sub: Subscription) =>
  typeof sub.plan === "string" ? sub.plan : sub.plan?._id ?? null;

const humanizeFeatureKey = (key: string) => {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const featureValueLabel = (feature: PlanFeature) => {
  if (typeof feature.numericValue === "number")
    return feature.numericValue === -1 ? "Unlimited" : String(feature.numericValue);
  if (typeof feature.booleanValue === "boolean")
    return feature.booleanValue ? "Included" : "Not included";
  return "—";
};

// ─── Subscriber counts (each card maps to a real backend value) ───────────────

interface SubscriberCounts {
  total: number;
  active: number;
  pending: number;
  past_due: number;
  canceled: number;
  expired: number;
}

// ─── Manage Subscriptions drawer ──────────────────────────────────────────────

function ManageSubscriptionDrawer({
  subscription,
  plan,
  open,
  onClose,
  onDowngrade,
  onCancel,
}: {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  open: boolean;
  onClose: () => void;
  onDowngrade: () => void;
  onCancel: () => void;
}) {
  const [showFeatures, setShowFeatures] = useState(true);
  if (!subscription) return null;

  const price = planPriceOf(subscription);
  const interval =
    subscription.planSnapshot?.interval ??
    (typeof subscription.plan === "object" ? subscription.plan?.interval : undefined);
  const intervalWord = interval === "yearly" ? "year" : "month";

  return (
    <Drawer title="Manage Subscriptions" open={open} onClose={onClose} bodyClassName="px-6 py-6 md:px-8">
      <div className="space-y-6">
        {/* Current plan */}
        <div className="rounded-2xl bg-[#E8F2FF] p-5">
          <p className="text-sm text-primary">Current Plan</p>
          <p className="mt-1 text-2xl font-semibold text-gray1">{planNameOf(subscription)}</p>
          <p className="mt-6 text-2xl font-semibold text-gray1">{formatNaira(price)}</p>
          <p className="mt-2 text-sm text-gray2">
            Billing period: {billingLabel(subscription)}
          </p>
        </div>

        {/* Auto renewal (non-functional) */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray5 p-4">
          <div>
            <p className="font-medium text-gray1">Enable auto renewal</p>
            <p className="mt-1 text-sm text-gray3">
              When enabled, the plan renews automatically when the current period expires.
            </p>
          </div>
          <Switch checked={!subscription.cancelAtPeriodEnd} aria-readonly />
        </div>

        {/* Plan detail */}
        <div className="rounded-2xl border border-[#13A83B] p-5">
          <p className="text-sm text-gray3">Plan</p>
          <p className="mt-1 text-xl font-semibold text-[#13A83B]">
            {formatNaira(price)} / {intervalWord}
          </p>
          <button
            type="button"
            onClick={() => setShowFeatures((v) => !v)}
            className="mt-4 flex w-full items-center justify-between border-t border-gray6 pt-4 text-left"
          >
            <span className="font-medium text-gray1">Features</span>
            {showFeatures ? (
              <ChevronUp className="size-5 text-gray2" />
            ) : (
              <ChevronDown className="size-5 text-gray2" />
            )}
          </button>
          {showFeatures ? (
            <ul className="mt-3 space-y-2">
              {!plan?.features?.length ? (
                <li className="text-sm text-gray3">No features listed for this plan.</li>
              ) : (
                plan.features.map((feature) => (
                  <li
                    key={feature.key}
                    className="flex items-center justify-between text-sm text-gray2"
                  >
                    <span>{humanizeFeatureKey(feature.key)}</span>
                    <span className="font-medium text-gray1">{featureValueLabel(feature)}</span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        {/* Actions (non-functional) */}
        <div className="space-y-3">
          <Button title="Upgrade Plan" type="button" className="h-14" />
          <button
            type="button"
            onClick={onDowngrade}
            className="h-14 w-full rounded-xl border border-[#FE6E00] text-base font-medium text-[#FE6E00]"
          >
            Downgrade
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-center text-base font-medium text-[#FE6E00]"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Downgrade drawer (non-functional) ────────────────────────────────────────

function DowngradeDrawer({
  open,
  onClose,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [showBilling, setShowBilling] = useState(true);
  const [showFeatures, setShowFeatures] = useState(true);
  const selected = plans.find((p) => p._id === selectedId) ?? null;
  const intervalWord = selected?.interval === "yearly" ? "year" : "month";

  return (
    <Drawer
      title="Downgrade Subscription Plan"
      open={open}
      onClose={onClose}
      bodyClassName="px-6 py-6 md:px-8"
    >
      <div className="space-y-5">
        <SingleSelect
          label=""
          placeholder="Select new plan"
          value={selectedId}
          onValueChange={setSelectedId}
          options={plans.map((p) => ({ value: p._id, label: p.name }))}
        />

        {selected ? (
          <div className="rounded-2xl border border-[#13A83B] p-5">
            <p className="text-sm text-gray3">Your new fee will be</p>
            <p className="mt-1 text-lg font-semibold text-[#13A83B]">
              {formatNaira(selected.price)} / {intervalWord}
            </p>
            <p className="mt-0.5 text-sm text-gray3">
              {formatNaira(selected.price)} Billed{" "}
              {selected.interval === "yearly" ? "yearly" : "monthly"}
            </p>

            <button
              type="button"
              onClick={() => setShowBilling((v) => !v)}
              className="mt-4 flex w-full items-center justify-between border-t border-gray6 pt-4 text-left"
            >
              <span className="text-base font-semibold text-gray1">Billing Period</span>
              {showBilling ? (
                <ChevronUp className="size-5 text-gray2" />
              ) : (
                <ChevronDown className="size-5 text-gray2" />
              )}
            </button>
            {showBilling ? (
              <p className="mt-2 text-sm text-gray2">
                Billed {selected.interval === "yearly" ? "yearly" : "monthly"}
                {selected.intervalCount > 1
                  ? ` (every ${selected.intervalCount} ${intervalWord}s)`
                  : ""}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => setShowFeatures((v) => !v)}
              className="mt-4 flex w-full items-center justify-between border-t border-gray6 pt-4 text-left"
            >
              <span className="text-base font-semibold text-gray1">Features</span>
              {showFeatures ? (
                <ChevronUp className="size-5 text-gray2" />
              ) : (
                <ChevronDown className="size-5 text-gray2" />
              )}
            </button>
            {showFeatures ? (
              <ul className="mt-2 space-y-2">
                {selected.features.length === 0 ? (
                  <li className="text-sm text-gray3">No features listed.</li>
                ) : (
                  selected.features.map((feature) => (
                    <li
                      key={feature.key}
                      className="flex items-center justify-between text-sm text-gray2"
                    >
                      <span>{humanizeFeatureKey(feature.key)}</span>
                      <span className="font-medium text-gray1">
                        {featureValueLabel(feature)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Button
          title="Downgrade"
          type="button"
          className="h-14"
          iconRight={<ArrowRight size={16} />}
        />
      </div>
    </Drawer>
  );
}

// ─── Cancel modal (non-functional) ────────────────────────────────────────────

function CancelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[460px] rounded-2xl bg-white p-0">
        <div className="px-8 pt-8">
          <h2 className="text-center text-lg font-medium text-[#FE6E00]">
            Cancel Subscription
          </h2>
          <div className="mt-5 rounded-2xl border border-[#FE6E00] bg-[#FFF7F0] px-5 py-5">
            <p className="text-center text-sm text-gray1">
              Are you sure you want to cancel current plan?
              <br />
              This will remove current plan privileges and take away all rolling
              premium features.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-8 pb-8 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-primary text-sm font-medium text-white"
          >
            No don&apos;t cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-gray4 text-sm font-medium text-gray2"
          >
            Yes Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);

  const [activeTab, setActiveTab] = useState<TabKey>("subscribers");

  const [subsPage, setSubsPage] = useState<SubscriptionPage<Subscription> | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [counts, setCounts] = useState<SubscriberCounts | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Subscription | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [plansCreateOpen, setPlansCreateOpen] = useState(false);

  // ── Load the paginated subscriber list (status filter + page hit the API) ──
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await subscriptionService.fetchAdminSubscriptions(token, {
          status: (statusFilter || undefined) as SubscriptionStatus | undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (!ignore) setSubsPage(res.data);
      } catch (nextError) {
        if (!ignore)
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to load subscribers.",
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [token, statusFilter, page]);

  // ── Load the count cards + plan catalogue once ──
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const loadAggregates = async () => {
      try {
        const statusKeys: SubscriptionStatus[] = [
          "active",
          "pending",
          "past_due",
          "canceled",
          "expired",
        ];
        const [total, ...byStatus] = await Promise.all([
          subscriptionService.fetchAdminSubscriptions(token, { limit: 1 }),
          ...statusKeys.map((status) =>
            subscriptionService.fetchAdminSubscriptions(token, { status, limit: 1 }),
          ),
        ]);
        if (ignore) return;
        const [active, pending, past_due, canceled, expired] = byStatus;
        setCounts({
          total: total.data.totalDocs,
          active: active.data.totalDocs,
          pending: pending.data.totalDocs,
          past_due: past_due.data.totalDocs,
          canceled: canceled.data.totalDocs,
          expired: expired.data.totalDocs,
        });
      } catch {
        /* counts are best-effort; the table stays the source of truth */
      }

      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const res = await subscriptionService.fetchAdminInvoices(token, {
          status: "paid",
          from: monthStart.toISOString(),
          limit: 1000,
        });
        if (ignore) return;
        const sum = res.data.docs.reduce((acc, inv) => acc + (inv.amount ?? 0), 0);
        setRevenue(sum);
      } catch {
        /* revenue is best-effort */
      }

      try {
        const res = await subscriptionService.fetchAdminPlans(token, { limit: 100 });
        if (!ignore) setPlans(res.data.docs);
      } catch {
        /* plans only feed the drawer/downgrade UI */
      }
    };

    void loadAggregates();
    return () => {
      ignore = true;
    };
  }, [token]);

  // ── Client-side refinement (search + user type) over the current page ──
  const rows = useMemo(() => {
    const docs = subsPage?.docs ?? [];
    const term = search.trim().toLowerCase();
    return docs.filter((sub) => {
      if (userType && (sub.ownerType ?? sub.owner?.role) !== userType) return false;
      if (!term) return true;
      return (
        ownerName(sub).toLowerCase().includes(term) ||
        planNameOf(sub).toLowerCase().includes(term)
      );
    });
  }, [subsPage, search, userType]);

  const userTypeOptions = useMemo(() => {
    const set = new Set<string>();
    (subsPage?.docs ?? []).forEach((sub) => {
      const t = sub.ownerType ?? sub.owner?.role;
      if (t) set.add(t);
    });
    return Array.from(set).map((value) => ({ value, label: titleCase(value) }));
  }, [subsPage]);

  const resolvedPlan = useMemo(() => {
    if (!selected) return null;
    if (typeof selected.plan === "object" && selected.plan) return selected.plan;
    const id = planIdOf(selected);
    return plans.find((p) => p._id === id) ?? null;
  }, [selected, plans]);

  const openManage = useCallback((sub: Subscription) => {
    setSelected(sub);
    setShowManage(true);
  }, []);

  const totalPages = subsPage?.totalPages ?? 1;
  const totalDocs = subsPage?.totalDocs ?? 0;
  const activePct =
    counts && counts.total > 0
      ? `${Math.round((counts.active / counts.total) * 100)}% of total`
      : "For this month";

  return (
    <>
      <Header
        title="Subscriptions"
        description="Manage plans, subscribers and feature access."
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Tabs + New Subscription */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-start rounded-lg bg-[#F1F5F9] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-6 py-1.5 text-base transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-[#111827] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                    : "text-[#4B5563]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "plans" ? (
            <Button
              title="Create New Plan"
              iconLeft={<span className="text-lg leading-none">+</span>}
              type="button"
              className="w-full md:w-auto"
              onClick={() => setPlansCreateOpen(true)}
            />
          ) : null}
        </div>

        {activeTab === "plans" ? (
          <PlansPanel
            token={token}
            createOpen={plansCreateOpen}
            onCreateOpenChange={setPlansCreateOpen}
          />
        ) : activeTab === "library" ? (
          <LibraryPanel token={token} />
        ) : (
          <>
            {/* Count cards — each maps to a real backend value */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Subscribers"
                value={counts ? counts.total.toLocaleString() : "—"}
                icon={<Users size={18} className="text-primary" />}
                iconBg="bg-[#E7F1FF]"
                subtitle="All subscribers"
              />
              <SummaryCard
                title="Active"
                value={counts ? counts.active.toLocaleString() : "—"}
                icon={<CheckCircle2 size={18} className="text-[#13A83B]" />}
                iconBg="bg-[#E8FAEE]"
                subtitle={activePct}
              />
              <SummaryCard
                title="Monthly Revenue"
                value={revenue === null ? "—" : formatNaira(revenue)}
                icon={<Wallet size={18} className="text-[#13A83B]" />}
                iconBg="bg-[#E8FAEE]"
                subtitle="Paid invoices this month"
              />
              <SummaryCard
                title="Past Due"
                value={counts ? counts.past_due.toLocaleString() : "—"}
                icon={<CalendarX2 size={18} className="text-[#D92D20]" />}
                iconBg="bg-[#FDE8E8]"
                subtitle="Requires action"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="Pending"
                value={counts ? counts.pending.toLocaleString() : "—"}
                icon={<Hourglass size={18} className="text-[#F6B90A]" />}
                iconBg="bg-[#FFF5DB]"
                subtitle="Awaiting first payment"
              />
              <SummaryCard
                title="Canceled"
                value={counts ? counts.canceled.toLocaleString() : "—"}
                icon={<TrendingDown size={18} className="text-[#C04FE0]" />}
                iconBg="bg-[#F8E8FF]"
                subtitle="Ended by subscriber"
              />
              <SummaryCard
                title="Expired"
                value={counts ? counts.expired.toLocaleString() : "—"}
                icon={<TrendingUp size={18} className="text-[#667085]" />}
                iconBg="bg-[#F2F4F7]"
                subtitle="Lapsed subscriptions"
              />
            </div>

            {/* Table */}
            <section className="card space-y-5 p-3 md:p-5">
              <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
                <Input
                  label="Search"
                  placeholder="Search by name or plan…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <SingleSelect
                  label="User type"
                  placeholder="All User Types"
                  value={userType}
                  onValueChange={(v) => setUserType(v === "all" ? "" : v)}
                  options={[{ value: "all", label: "All User Types" }, ...userTypeOptions]}
                />
                <SingleSelect
                  label="Status"
                  placeholder="All Statuses"
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v === "all" ? "" : v);
                    setPage(1);
                  }}
                  options={[{ value: "all", label: "All Statuses" }, ...STATUS_OPTIONS]}
                />
                <Button
                  title="Export"
                  variant="secondaryLight"
                  iconLeft={<Download size={16} />}
                  className="h-14 self-end"
                  type="button"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="max-w-full overflow-hidden rounded-2xl border border-gray5">
                <Table className="min-w-[1040px]">
                  <TableHeader className="[&_tr]:bg-[#F3F4F6]">
                    <TableRow>
                      <TableHead>Subscriber name</TableHead>
                      <TableHead>User type</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Start date</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auto renew</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && !subsPage ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-16 text-center">
                          <Spinner />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-16 text-center text-gray3">
                          No subscribers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((sub) => {
                        const badge = STATUS_BADGE[sub.status];
                        return (
                          <TableRow key={sub._id}>
                            <TableCell className="min-w-[180px]">
                              <div className="flex items-center gap-3">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E7F1FF] text-xs font-medium text-primary">
                                  {ownerInitials(sub)}
                                </span>
                                <span className="font-medium text-gray1">
                                  {ownerName(sub)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{userTypeLabel(sub)}</TableCell>
                            <TableCell className="font-medium text-gray1">
                              {planNameOf(sub)}
                            </TableCell>
                            <TableCell>{billingLabel(sub)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(sub.currentPeriodStart)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(sub.currentPeriodEnd ?? sub.nextBillingDate)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!sub.cancelAtPeriodEnd}
                                aria-readonly
                              />
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => openManage(sub)}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                View
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray3 md:flex-row">
                <span>
                  {totalDocs === 0
                    ? "No results"
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalDocs)} of ${totalDocs.toLocaleString()} subscribers`}
                </span>
                <div className="flex gap-2">
                  <Button
                    title="Previous"
                    variant="secondaryLight"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-auto"
                    type="button"
                  />
                  <Button
                    title="Next"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-auto"
                    type="button"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <ManageSubscriptionDrawer
        subscription={selected}
        plan={resolvedPlan}
        open={showManage}
        onClose={() => setShowManage(false)}
        onDowngrade={() => {
          setShowManage(false);
          setShowDowngrade(true);
        }}
        onCancel={() => {
          setShowManage(false);
          setShowCancel(true);
        }}
      />

      <DowngradeDrawer
        open={showDowngrade}
        onClose={() => setShowDowngrade(false)}
        plans={plans}
      />

      <CancelModal open={showCancel} onClose={() => setShowCancel(false)} />
    </>
  );
}
