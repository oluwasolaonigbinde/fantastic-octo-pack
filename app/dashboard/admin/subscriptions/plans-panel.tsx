"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  SingleSelect,
  Spinner,
  Switch,
  Textarea,
} from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import subscriptionService from "@/services/subscriptionService";
import type {
  CreatePlanPayload,
  FeatureDefinition,
  PlanFeature,
  PlanStatus,
  SubscriptionInterval,
  SubscriptionPage,
  SubscriptionPlan,
  SubscriptionRole,
} from "@/types/subscription";

const PAGE_SIZE = 10;

/** Plans are scoped by subscriber role; "Manufacturers" maps to the OEM role. */
const ROLE_TABS: { key: SubscriptionRole; label: string }[] = [
  { key: "distributor", label: "Distributors" },
  { key: "oem", label: "Manufacturers" },
  { key: "engineer", label: "Engineers" },
];

const ROLE_LABEL: Partial<Record<SubscriptionRole, string>> = {
  distributor: "Distributor",
  oem: "Manufacturer",
  engineer: "Engineer",
};

// The API only models `active` / `archived`; we present archived as "Inactive".
const STATUS_OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Inactive" },
];

const STATUS_BADGE: Record<PlanStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[#E8FAEE] text-[#13A83B]" },
  archived: { label: "Inactive", className: "bg-[#FDE8E8] text-[#D92D20]" },
};

const FEATURE_TYPE_BADGE: Record<string, string> = {
  boolean: "bg-[#F3E8FF] text-[#7E22CE]",
  limit: "bg-[#E7F1FF] text-[#0669D9]",
  metered: "bg-[#FFF5DB] text-[#B07A00]",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNaira = (kobo?: number | null) =>
  `₦${((kobo ?? 0) / 100).toLocaleString("en-NG")}`;

const intervalWord = (interval?: SubscriptionInterval) =>
  interval === "yearly" ? "yr" : "mnth";

const humanizeKey = (key: string) => {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Infer a feature's value type from the catalog, falling back to its value shape. */
const featureType = (
  feature: PlanFeature,
  catalog: Map<string, FeatureDefinition>,
): string => {
  const def = catalog.get(feature.key);
  if (def) return def.type;
  if (typeof feature.booleanValue === "boolean") return "boolean";
  return "limit";
};

const featureName = (key: string, catalog: Map<string, FeatureDefinition>) =>
  catalog.get(key)?.name ?? humanizeKey(key);

/** Numeric limits use -1 as the "unlimited" sentinel. */
const formatLimit = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return value === -1 ? "Unlimited" : String(value);
};

// ─── Plan form (create + edit), wired to create/update endpoints ───────────────

interface PlanFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  token?: string;
  /** When set, the form edits this plan; otherwise it creates a new one. */
  plan: SubscriptionPlan | null;
  role: SubscriptionRole;
  catalog: FeatureDefinition[];
}

interface FeatureRow {
  key: string;
  type: string;
  /** numeric features only — kept as a string for the input */
  value: string;
  booleanValue: boolean;
}

function PlanFormModal({
  open,
  onClose,
  onSaved,
  token,
  plan,
  role,
  catalog,
}: PlanFormProps) {
  const isEdit = !!plan;
  const catalogMap = useMemo(
    () => new Map(catalog.map((c) => [c.key, c])),
    [catalog],
  );

  // State is seeded once from props; the parent passes a `key` so the form
  // remounts (and re-seeds) whenever the target plan changes.
  const [name, setName] = useState(plan?.name ?? "");
  const [price, setPrice] = useState(plan ? String((plan.price ?? 0) / 100) : "");
  const [interval, setInterval] = useState<SubscriptionInterval>(
    plan?.interval ?? "monthly",
  );
  const [description, setDescription] = useState(plan?.description ?? "");
  const [rows, setRows] = useState<FeatureRow[]>(() =>
    plan
      ? plan.features.map((f) => ({
          key: f.key,
          type: featureType(f, catalogMap),
          value:
            typeof f.numericValue === "number" ? String(f.numericValue) : "",
          booleanValue: f.booleanValue ?? true,
        }))
      : [],
  );
  const [addingKey, setAddingKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableToAdd = useMemo(
    () =>
      catalog.filter(
        (c) =>
          !rows.some((r) => r.key === c.key) &&
          (!c.role || c.role === role),
      ),
    [catalog, rows, role],
  );

  const addFeature = () => {
    if (!addingKey) return;
    const def = catalogMap.get(addingKey);
    setRows((prev) => [
      ...prev,
      {
        key: addingKey,
        type: def?.type ?? "limit",
        value:
          def?.defaultNumericValue !== undefined
            ? String(def.defaultNumericValue)
            : "",
        booleanValue: def?.defaultBooleanValue ?? false,
      },
    ]);
    setAddingKey("");
  };

  const removeFeature = (key: string) =>
    setRows((prev) => prev.filter((r) => r.key !== key));

  const updateRowValue = (key: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));

  const updateRowBoolean = (key: string, booleanValue: boolean) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, booleanValue } : r)),
    );

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }
    const priceKobo = Math.round(Number(price || 0) * 100);
    if (Number.isNaN(priceKobo) || priceKobo < 0) {
      setError("Enter a valid price.");
      return;
    }

    const features: PlanFeature[] = rows.map((r) =>
      r.type === "boolean"
        ? { key: r.key, booleanValue: r.booleanValue }
        : { key: r.key, numericValue: Number(r.value || 0) },
    );

    setSaving(true);
    setError("");
    try {
      if (isEdit && plan) {
        await subscriptionService.updatePlan(token, plan._id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceKobo,
          interval,
          features,
        });
      } else {
        const payload: CreatePlanPayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          role,
          price: priceKobo,
          interval,
          features,
        };
        await subscriptionService.createPlan(token, payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save the plan.");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = plan ? STATUS_BADGE[plan.status] : null;

  return (
    <Dialog open={open} onOpenChange={() => !saving && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] max-w-[920px] overflow-y-auto rounded-2xl bg-white p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-[#EAF2FE] px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold text-gray1 md:text-xl">
              {isEdit ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            {statusBadge ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X className="size-5 text-gray2" />
          </button>
        </div>
        <DialogDescription className="sr-only">
          {isEdit
            ? "Edit this subscription plan's details and features."
            : "Create a new subscription plan."}
        </DialogDescription>

        <div className="space-y-8 px-4 py-6 md:px-6">
          {/* Plan information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded bg-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray1">
                Plan information
              </h3>
            </div>

            <Input
              label="Plan name"
              placeholder="Enter plan name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Price (₦)"
                type="number"
                placeholder="50000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <SingleSelect
                label="Billing interval"
                value={interval}
                onValueChange={(v) => setInterval(v as SubscriptionInterval)}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Annual" },
                ]}
              />
            </div>

            <Textarea
              label="Description"
              placeholder="Describe this plan…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          {/* Manage features */}
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded bg-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray1">
                  Manage features
                </h3>
              </div>
              {availableToAdd.length > 0 ? (
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <SingleSelect
                    label=""
                    placeholder="Select feature"
                    value={addingKey}
                    onValueChange={setAddingKey}
                    options={availableToAdd.map((c) => ({
                      value: c.key,
                      label: c.name,
                    }))}
                    className="h-10 w-full sm:w-[180px]"
                  />
                  <Button
                    title="Add new feature"
                    iconLeft={<Plus size={14} />}
                    size="sm"
                    type="button"
                    className="w-full whitespace-nowrap sm:w-auto"
                    disabled={!addingKey}
                    onClick={addFeature}
                  />
                </div>
              ) : (
                <p className="text-sm text-gray3">
                  {catalog.length === 0
                    ? "No features are configured in the catalog yet."
                    : "All available features have already been added to this plan."}
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray5">
              <Table className="min-w-[600px]">
                <TableHeader className="[&_tr]:bg-[#F3F4F6]">
                  <TableRow>
                    <TableHead>Feature name</TableHead>
                    <TableHead>Value type</TableHead>
                    <TableHead>Current value</TableHead>
                    <TableHead>New value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-gray3">
                        No features yet. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const original = plan?.features.find((f) => f.key === row.key);
                      const current =
                        row.type === "boolean"
                          ? typeof original?.booleanValue === "boolean"
                            ? original.booleanValue
                              ? "True"
                              : "False"
                            : "—"
                          : formatLimit(original?.numericValue);
                      return (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium text-gray1">
                            {featureName(row.key, catalogMap)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-md px-2 py-1 text-xs font-medium ${
                                FEATURE_TYPE_BADGE[row.type] ??
                                "bg-gray6 text-gray2"
                              }`}
                            >
                              {humanizeKey(row.type)}
                            </span>
                          </TableCell>
                          <TableCell>{current}</TableCell>
                          <TableCell>
                            {row.type === "boolean" ? (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={row.booleanValue}
                                  onCheckedChange={(v) =>
                                    updateRowBoolean(row.key, v)
                                  }
                                />
                                <span className="text-sm text-gray2">
                                  {row.booleanValue ? "True" : "False"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={row.value}
                                  onChange={(e) =>
                                    updateRowValue(row.key, e.target.value)
                                  }
                                  className="h-9 w-24 rounded-lg border border-gray5 px-2 text-sm"
                                />
                                {row.value.trim() === "-1" ? (
                                  <span className="text-xs text-gray3">Unlimited</span>
                                ) : null}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => removeFeature(row.key)}
                              aria-label="Remove feature"
                            >
                              <Trash2 size={16} className="text-[#D92D20]" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              title="Cancel"
              variant="secondaryLight"
              type="button"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={onClose}
            />
            <Button
              title={isEdit ? "Save Changes" : "Create Plan"}
              type="button"
              className="w-full sm:w-auto"
              isBusy={saving}
              onClick={handleSave}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plans panel ───────────────────────────────────────────────────────────────

export function PlansPanel({
  token,
  createOpen,
  onCreateOpenChange,
}: {
  token?: string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const [roleTab, setRoleTab] = useState<SubscriptionRole>("distributor");
  const [plansPage, setPlansPage] = useState<SubscriptionPage<SubscriptionPlan> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<FeatureDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SubscriptionPlan | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Feature catalog is shared across the create/edit forms.
  useEffect(() => {
    if (!token) return;
    let ignore = false;
    subscriptionService
      .fetchFeatureCatalog(token)
      .then((res) => {
        if (!ignore) setCatalog(res.data.docs);
      })
      .catch(() => {
        /* catalog only powers the feature picker */
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  // Load plans for the active role tab + status filter.
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await subscriptionService.fetchAdminPlans(token, {
          role: roleTab,
          status: (status || undefined) as PlanStatus | undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (ignore) return;
        setPlansPage(res.data);

        // Subscriber count per plan (the list endpoint doesn't include it).
        const entries = await Promise.all(
          res.data.docs.map(async (plan) => {
            try {
              const subs = await subscriptionService.fetchAdminSubscriptions(token, {
                planId: plan._id,
                limit: 1,
              });
              return [plan._id, subs.data.totalDocs] as const;
            } catch {
              return [plan._id, 0] as const;
            }
          }),
        );
        if (!ignore) setCounts(Object.fromEntries(entries));
      } catch (e) {
        if (!ignore)
          setError(e instanceof Error ? e.message : "Failed to load plans.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void load();
    return () => {
      ignore = true;
    };
  }, [token, roleTab, status, page, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const rows = useMemo(() => {
    const docs = plansPage?.docs ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return docs;
    return docs.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term),
    );
  }, [plansPage, search]);

  // Trash → archive (no hard-delete endpoint exists).
  const confirmArchive = async () => {
    if (!token || !archiveTarget) return;
    setArchiving(true);
    try {
      await subscriptionService.updatePlan(token, archiveTarget._id, {
        status: "archived",
      });
      setArchiveTarget(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive the plan.");
    } finally {
      setArchiving(false);
    }
  };

  const totalDocs = plansPage?.totalDocs ?? 0;
  const totalPages = plansPage?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Role sub-tabs */}
      <div className="flex gap-8 border-b border-gray5">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setRoleTab(tab.key);
              setPage(1);
            }}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              roleTab === tab.key
                ? "border-primary text-gray1"
                : "border-transparent text-gray3 hover:text-gray1"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="card space-y-5 p-3 md:p-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Input
              label=""
              placeholder="Search plan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-[280px]"
            />
            <SingleSelect
              label=""
              placeholder="All Statuses"
              value={status}
              onValueChange={(v) => {
                setStatus(v === "all" ? "" : v);
                setPage(1);
              }}
              options={[{ value: "all", label: "All Statuses" }, ...STATUS_OPTIONS]}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-lg border border-gray5 text-gray3"
              aria-label="Export"
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              onClick={refresh}
              className="flex size-10 items-center justify-center rounded-lg border border-gray5 text-gray3"
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="max-w-full overflow-hidden rounded-2xl border border-gray5">
          <Table className="min-w-[840px]">
            <TableHeader className="[&_tr]:bg-[#F3F4F6]">
              <TableRow>
                <TableHead>Plan name</TableHead>
                <TableHead>User type</TableHead>
                <TableHead>Price ({intervalWord()}/yr)</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !plansPage ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Spinner />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-gray3">
                    No plans found for {ROLE_LABEL[roleTab]}.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((plan) => {
                  const badge = STATUS_BADGE[plan.status];
                  return (
                    <TableRow key={plan._id}>
                      <TableCell className="min-w-[180px]">
                        <p className="font-medium text-gray1">{plan.name}</p>
                        {plan.description ? (
                          <p className="text-xs text-gray3">{plan.description}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md bg-[#FBEEE2] px-2.5 py-1 text-xs font-medium uppercase text-[#9A5B2A]">
                          {ROLE_LABEL[plan.role ?? roleTab] ?? plan.role}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatNaira(plan.price)} /{" "}
                        {plan.interval === "yearly" ? "yr" : "mnth"}
                      </TableCell>
                      <TableCell>
                        {counts[plan._id] ?? 0}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditing(plan)}
                            aria-label="Edit plan"
                          >
                            <Pencil size={16} className="text-gray2" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(plan)}
                            aria-label="Archive plan"
                          >
                            <Trash2 size={16} className="text-[#D92D20]" />
                          </button>
                        </div>
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
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalDocs)} of ${totalDocs.toLocaleString()} Plans`}
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

      {/* Edit */}
      <PlanFormModal
        key={`edit-${editing?._id ?? "none"}`}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
        token={token}
        plan={editing}
        role={roleTab}
        catalog={catalog}
      />

      {/* Create */}
      <PlanFormModal
        key={`create-${createOpen}`}
        open={createOpen}
        onClose={() => onCreateOpenChange(false)}
        onSaved={refresh}
        token={token}
        plan={null}
        role={roleTab}
        catalog={catalog}
      />

      {/* Archive confirmation */}
      <Dialog
        open={!!archiveTarget}
        onOpenChange={() => !archiving && setArchiveTarget(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[440px] rounded-2xl bg-white p-6"
        >
          <DialogTitle className="text-lg font-semibold text-gray1">
            Archive plan
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray2">
            Are you sure you want to archive{" "}
            <span className="font-medium text-gray1">
              “{archiveTarget?.name}”
            </span>
            ? It will no longer be available for new subscribers. You can
            reactivate it later by editing the plan.
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              title="Cancel"
              variant="secondaryLight"
              type="button"
              className="w-full sm:w-auto"
              disabled={archiving}
              onClick={() => setArchiveTarget(null)}
            />
            <Button
              title="Archive plan"
              type="button"
              className="w-full bg-[#D92D20] hover:bg-[#b9241a] sm:w-auto"
              isBusy={archiving}
              onClick={confirmArchive}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlansPanel;
