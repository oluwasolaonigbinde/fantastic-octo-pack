"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, FileText, Plus, ThumbsUp, Upload, X } from "lucide-react";
import Header from "../../component/header";
import { Button, EmptyState, Input, Skeleton } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useBuyerRfqDetails, useBuyerRfqsQuery, useCreateRfqMutation } from "@/hooks/queries/rfqs";
import { useCategoriesQuery } from "@/hooks/queries/categories";
import addressService from "@/services/addressService";
import rfqService from "@/services/rfqService";
import { QUOTE_STATUS_LABELS, RFQ_STATUS_LABELS, type CreateRfqItem, type Quote, type Rfq, type RfqDetailResponse, type RfqRoutingMode } from "@/types/rfq";
import type { UserAddress } from "@/types/address";
import BulkQuoteFlow from "./BulkQuoteFlow";
import DistributorPicker from "./DistributorPicker";
import { batchIdOf } from "./quotePresentation";

type FormItem = CreateRfqItem;
type Filter = "all" | "sent" | "received" | "approved" | "declined";

/** One line in the requests table — either a single RFQ or a whole bulk batch. */
interface ListRow {
  key: string;
  href: string;
  name: string;
  suffix: string;
  itemsLabel: string;
  responsesLabel: string;
  pendingResponses: boolean;
  deliveryTimeline: string;
  statusLabel: string;
  statusClass: string;
}

const blankItem = (): FormItem => ({ productName: "", quantity: 1, category: "", subCategory: "", brand: "", model: "", description: "" });
const addressLabel = (address: UserAddress) => [address.address, address.city, address.state].filter(Boolean).join(", ");
const RESPONDED_STATUSES: Quote["status"][] = ["quoted", "unavailable", "selected_for_order", "not_selected", "rejected_by_buyer"];
const respondedCount = (quotes: Quote[] = []) => quotes.filter((quote) => RESPONDED_STATUSES.includes(quote.status)).length;

const quoteFor = (detail?: RfqDetailResponse) => detail?.quotes.find((quote) => quote.status === "selected_for_order") || detail?.quotes.find((quote) => quote.status === "quoted") || detail?.quotes[0];
const quoteStatus = (rfq: Rfq, quote?: Quote) => {
  if (rfq.status === "converted_to_order" || quote?.status === "selected_for_order") return "approved" as const;
  if (quote?.status === "rejected_by_buyer" || quote?.status === "not_selected") return "declined" as const;
  if (rfq.status === "responded_partial" || rfq.status === "responded_complete" || quote?.status === "quoted" || quote?.status === "unavailable") return "received" as const;
  return "open" as const;
};
const quoteStatusLabel = (rfq: Rfq, quote?: Quote) => quote ? QUOTE_STATUS_LABELS[quote.status] : RFQ_STATUS_LABELS[rfq.status];
const quoteStatusClass = (status: ReturnType<typeof quoteStatus>) => ({ approved: "text-success", declined: "text-danger", received: "text-primary", open: "text-primary" })[status];

export default function BuyerRfqsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const { data: rfqs, isLoading, refetch } = useBuyerRfqsQuery();
  const details = useBuyerRfqDetails((rfqs ?? []).map((rfq) => rfq._id));
  const { data: categories = [] } = useCategoriesQuery({ page: 1, limit: 100 });
  const createRfq = useCreateRfqMutation();
  const hasCreateIntent = searchParams.get("action") === "create";
  /**
   * Targeted quote request (BAI-50): a distributor profile links here with
   * `routingMode=direct&distributorId=…` so the RFQ goes to that distributor
   * alone rather than through the marketplace routing engine.
   */
  const targetedDistributorId = hasCreateIntent && searchParams.get("routingMode") === "direct" ? searchParams.get("distributorId") || "" : "";
  const targetedDistributorName = targetedDistributorId ? searchParams.get("distributorName") || "" : "";
  const [isComposerOpen, setIsComposerOpen] = useState(hasCreateIntent);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [items, setItems] = useState<FormItem[]>(() => [{ ...blankItem(), productName: hasCreateIntent ? searchParams.get("productName") || "" : "", category: hasCreateIntent ? searchParams.get("category") || "" : "", subCategory: hasCreateIntent ? searchParams.get("subCategory") || "" : "" }]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressId, setAddressId] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [routingMode, setRoutingMode] = useState<RfqRoutingMode>(targetedDistributorId ? "direct" : "automatic");
  const [directDistributorIds, setDirectDistributorIds] = useState<string[]>(targetedDistributorId ? [targetedDistributorId] : []);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const response = await addressService.fetchAddresses(token);
      const next = response.data ?? [];
      setAddresses(next);
      setAddressId((current) => current || next.find((item) => item.isDefault)?._id || next[0]?._id || "");
    } catch { setAddresses([]); }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAddresses(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAddresses]);

  const detailById = useMemo(() => new Map((rfqs ?? []).map((rfq, index) => [rfq._id, details[index]?.data])), [details, rfqs]);
  const modeScoped = useMemo(() => (rfqs ?? []).filter((rfq) => rfq.isBulk === (mode === "bulk")), [rfqs, mode]);
  const totals = useMemo(() => ({
    // Bulk requests are counted as the buyer submitted them — one per batch,
    // not one per product row the backend expanded the batch into.
    total: mode === "bulk"
      ? new Set(modeScoped.map((rfq) => batchIdOf(rfq) ?? rfq._id)).size
      : modeScoped.length,
    responded: modeScoped.filter((rfq) => quoteStatus(rfq, quoteFor(detailById.get(rfq._id))) === "received").length,
    open: modeScoped.filter((rfq) => quoteStatus(rfq, quoteFor(detailById.get(rfq._id))) === "open").length,
  }), [detailById, mode, modeScoped]);
  const visibleRfqs = useMemo(() => modeScoped.filter((rfq) => {
    if (filter === "all") return true;
    const status = quoteStatus(rfq, quoteFor(detailById.get(rfq._id)));
    return filter === "sent" ? status === "open" : status === filter;
  }), [detailById, filter, modeScoped]);
  /**
   * Rows for the list. A single RFQ is one row; RFQs created through the
   * email-targeted bulk endpoint share a `bulkBatch` and collapse into one row
   * per batch, which is the unit the buyer submitted and opens as "Bulk RFQ".
   */
  const rows = useMemo<ListRow[]>(() => {
    const rfqRow = (rfq: Rfq): ListRow => {
      const detail = detailById.get(rfq._id);
      const totalQuotes = detail?.quotes.length ?? 0;
      const status = quoteStatus(rfq, quoteFor(detail));
      return {
        key: rfq._id,
        href: `/dashboard/buyer/rfqs/${rfq._id}`,
        name: rfq.title || rfq.items[0]?.productName || "Sourcing request",
        suffix: rfq.items.length > 1 ? ` +${rfq.items.length - 1} more` : "",
        itemsLabel: String(rfq.items.length),
        responsesLabel: totalQuotes === 0 ? "Finding…" : `${respondedCount(detail?.quotes)} of ${totalQuotes}`,
        pendingResponses: totalQuotes === 0,
        deliveryTimeline: rfq.deliveryTimeline || "--",
        statusLabel: quoteStatusLabel(rfq, quoteFor(detail)),
        statusClass: quoteStatusClass(status),
      };
    };

    if (mode !== "bulk") return visibleRfqs.map(rfqRow);

    const batched = new Map<string, Rfq[]>();
    const list: ListRow[] = [];
    visibleRfqs.forEach((rfq) => {
      const batchId = batchIdOf(rfq);
      if (!batchId) {
        list.push(rfqRow(rfq));
        return;
      }
      batched.set(batchId, [...(batched.get(batchId) ?? []), rfq]);
    });

    batched.forEach((batchRfqs, batchId) => {
      const quoted = batchRfqs.filter(
        (rfq) => respondedCount(detailById.get(rfq._id)?.quotes) > 0,
      ).length;
      const approved = batchRfqs.filter((rfq) => rfq.status === "converted_to_order").length;
      const first = batchRfqs[0];
      list.push({
        key: batchId,
        href: `/dashboard/buyer/rfqs/bulk/${batchId}`,
        name:
          (typeof first.bulkBatch === "object" && first.bulkBatch?.title) ||
          first.title ||
          "Bulk RFQ",
        suffix: ` · ${batchRfqs.length} product${batchRfqs.length === 1 ? "" : "s"}`,
        itemsLabel: String(batchRfqs.length),
        responsesLabel: `${quoted} of ${batchRfqs.length} quoted`,
        pendingResponses: quoted === 0,
        deliveryTimeline: first.deliveryTimeline || first.deliveryLocation || "--",
        statusLabel:
          approved === batchRfqs.length
            ? "Approved"
            : quoted === 0
              ? "Awaiting responses"
              : quoted === batchRfqs.length
                ? "Quotes received"
                : "Partially quoted",
        statusClass:
          approved === batchRfqs.length ? "text-success" : quoted === 0 ? "text-primary" : "text-primary",
      });
    });

    return list;
  }, [detailById, mode, visibleRfqs]);

  const selectedCategories = items.map((item) => categories.find((category) => category._id === item.category));

  const openComposer = () => { setItems([blankItem()]); setRoutingMode("automatic"); setDirectDistributorIds([]); setIsComposerOpen(true); };
  const updateItem = (index: number, update: Partial<FormItem>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));
  const resetComposer = () => { setItems([blankItem()]); setDeliveryTimeline(""); setAdditionalNotes(""); setAttachments([]); setRoutingMode("automatic"); setDirectDistributorIds([]); setError(null); setIsComposerOpen(false); };

  const submit = async () => {
    if (!token) return;
    const invalid = items.some((item) => !item.productName.trim() || !item.category || item.quantity < 1);
    if (invalid || !addressId) { setError(!addressId ? "Select a saved delivery address before submitting." : "Every item needs a product name, category, and quantity."); return; }
    if (routingMode === "direct" && directDistributorIds.length === 0) { setError("Pick at least one distributor, or switch back to automatic matching."); return; }
    const requestItems = items.map((item) => ({
      productName: item.productName.trim(),
      quantity: item.quantity,
      category: item.category,
      ...(item.subCategory?.trim() ? { subCategory: item.subCategory.trim() } : {}),
      ...(item.brand?.trim() ? { brand: item.brand.trim() } : {}),
      ...(item.model?.trim() ? { model: item.model.trim() } : {}),
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
      ...(item.notes?.trim() ? { notes: item.notes.trim() } : {}),
    }));
    setError(null);
    try {
      const created = await createRfq.mutateAsync({ data: { items: requestItems, addressId, deliveryTimeline: deliveryTimeline || undefined, additionalNotes: additionalNotes || undefined, routingMode, ...(routingMode === "direct" ? { directDistributorIds } : {}) }, attachments });
      await rfqService.submitRfq(token, created.data._id);
      await refetch();
      resetComposer();
      setSubmitted(true);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to submit the RFQ. Please try again."); }
  };

  return (
    <div className="min-h-full bg-gray7">
      <Header title="Request For Quotes" description="View all and send request for quotes" />
      <main className="mx-auto max-w-[1160px] space-y-4 p-4 md:space-y-5 md:p-6">
        <div className="grid grid-cols-2 border-b border-gray5 text-sm md:text-base">
          <button type="button" onClick={() => { setMode("single"); setFilter("all"); }} className={`h-14 border-b-2 transition-colors ${mode === "single" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Single Quotes</button>
          <button type="button" onClick={() => { setMode("bulk"); setFilter("all"); }} className={`h-14 border-b-2 transition-colors ${mode === "bulk" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Bulk Quotes</button>
        </div>
        <section className="rounded-lg border border-gray5 bg-white p-5 md:p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className="text-3xl font-semibold leading-none text-gray1">{totals.total}</p><p className="mt-3 text-lg text-gray1">{mode === "bulk" ? "Bulk requests sent" : "Single requests sent"}</p><p className="mt-3 text-sm text-gray3">Responded request: {totals.responded} <span className="mx-2 text-gray5">|</span> Pending request: {totals.open}</p></div>
            <div className="grid gap-3 sm:grid-cols-2 md:w-[480px]"><Button title="Bulk Quote" variant="secondaryLight" size="md" iconLeft={<Plus size={20} />} onClick={() => setIsBulkOpen(true)} className="!border-[#fe6e00] !bg-white !text-[#fe6e00] hover:!bg-[#fff7f0]" /><Button title="Send Quote" variant="primary" size="md" iconLeft={<Plus size={20} />} onClick={openComposer} /></div>
          </div>
        </section>

        <nav aria-label="Quote status" className="flex overflow-x-auto border-b border-gray5">
          <Tab label="All Quotes" active={filter === "all"} onClick={() => setFilter("all")} />
          <Tab label="Quote Sent" active={filter === "sent"} onClick={() => setFilter("sent")} />
          <Tab label="Quote Received" active={filter === "received"} onClick={() => setFilter("received")} />
          <Tab label="Quotes Approved" active={filter === "approved"} onClick={() => setFilter("approved")} />
          <Tab label="Quotes Declined" active={filter === "declined"} onClick={() => setFilter("declined")} />
        </nav>

        <section className="overflow-hidden rounded-xl border border-gray5 bg-white p-5 md:p-5">
          <h2 className="text-xl font-medium text-gray1">Your requests</h2>
          <p className="mt-1 text-sm text-gray3">Each request routes to matching suppliers. Open a request to see who responded and their offers.</p>
          {isLoading ? (
            <div className="mt-8 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : rows.length === 0 ? (
            <EmptyState title="No requests to show" description="Start a sourcing request to receive supplier quotes." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-8 hidden overflow-x-auto md:block">
                <table className="w-full table-fixed text-left">
                  <thead className="border-b border-gray6 text-sm text-gray3">
                    <tr>
                      <th className="w-[36%] pb-5 pr-4 font-medium">Request</th>
                      <th className="w-[10%] pb-5 pr-4 font-medium">Items</th>
                      <th className="w-[16%] pb-5 pr-4 font-medium">Responses</th>
                      <th className="w-[16%] pb-5 pr-4 font-medium">Delivery time</th>
                      <th className="w-[14%] pb-5 pr-4 font-medium">Status</th>
                      <th className="w-[8%] pb-5 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="cursor-pointer border-b border-gray6 text-sm hover:bg-gray7/60" onClick={() => router.push(row.href)}>
                        <td className="py-5 pr-4 font-medium text-gray1"><span className="block truncate">{row.name}{row.suffix ? <span className="text-gray3">{row.suffix}</span> : null}</span></td>
                        <td className="py-5 pr-4 text-gray1">{row.itemsLabel}</td>
                        <td className="py-5 pr-4 text-gray1">{row.pendingResponses ? <span className="text-gray3">{row.responsesLabel}</span> : row.responsesLabel}</td>
                        <td className="py-5 pr-4 text-gray1"><span className="block truncate">{row.deliveryTimeline}</span></td>
                        <td className={`py-5 pr-4 font-medium ${row.statusClass}`}><span className="block truncate">{row.statusLabel}</span></td>
                        <td className="py-5"><Link href={row.href} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1.5 font-medium text-success hover:underline"><Eye size={18} />View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-6 space-y-3 md:hidden">
                {rows.map((row) => (
                  <Link key={row.key} href={row.href} className="block rounded-xl border border-gray5 p-4 hover:bg-gray7/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray1">{row.name}</p>
                        <p className="mt-1 text-xs text-gray3">{row.itemsLabel} item{row.itemsLabel === "1" ? "" : "s"} · {row.responsesLabel}{row.deliveryTimeline !== "--" ? ` · ${row.deliveryTimeline}` : ""}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-medium ${row.statusClass}`}>{row.statusLabel}</span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-success"><Eye size={16} />View request</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <BulkQuoteFlow open={isBulkOpen} onClose={() => setIsBulkOpen(false)} categories={categories} addresses={addresses} onSubmitted={() => { void refetch(); setSubmitted(true); }} />

      {isComposerOpen ? <div className="fixed inset-0 z-50 flex bg-gray1/40 p-0 md:items-center md:justify-center md:p-6"><section role="dialog" aria-modal="true" aria-label="Request a quote" className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#fbfbfc] shadow-xl md:h-auto md:max-h-[90vh] md:rounded-2xl"><header className="flex items-center justify-between border-b border-gray5 bg-white px-5 py-5"><div><h2 className="text-xl font-semibold text-gray1">Single Quote</h2><p className="mt-1 text-sm text-gray3">{targetedDistributorId ? `Only ${targetedDistributorName || "the distributor you picked"} will receive this request.` : "Matching suppliers will receive your request after submission."}</p></div><button type="button" aria-label="Close request form" onClick={resetComposer} className="rounded p-2 text-gray2 hover:bg-gray7"><X size={22} /></button></header><div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">{items.map((item, index) => { const category = selectedCategories[index]; return <fieldset key={index} className="space-y-4 rounded-lg border border-gray5 bg-white p-4"><div className="flex items-center justify-between"><legend className="font-semibold text-gray1">Item {index + 1}</legend></div><label className="block text-sm text-gray1">Category<select value={item.category} onChange={(event) => updateItem(index, { category: event.target.value, subCategory: "" })} className="mt-2 h-12 w-full rounded-lg border border-gray5 bg-white px-3"><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label><label className="block text-sm text-gray1">Sub-category<select value={item.subCategory || ""} onChange={(event) => updateItem(index, { subCategory: event.target.value })} disabled={!category} className="mt-2 h-12 w-full rounded-lg border border-gray5 bg-white px-3 disabled:bg-gray7"><option value="">Select sub-category (optional)</option>{category?.subcategories.map((subcategory) => <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>)}</select></label><Input id={`rfq-product-${index}`} label="Product name" placeholder="Enter product name" value={item.productName} onValueChange={(value) => updateItem(index, { productName: value })} /><div className="grid gap-4 sm:grid-cols-2"><Input id={`rfq-model-${index}`} label="Model (optional)" placeholder="Enter model" value={item.model || ""} onValueChange={(value) => updateItem(index, { model: value })} /><Input id={`rfq-quantity-${index}`} label="Quantity" type="number" placeholder="Enter quantity" value={String(item.quantity)} onValueChange={(value) => updateItem(index, { quantity: Math.max(1, Number(value) || 1) })} /></div><label className="block text-sm text-gray1">Description<textarea value={item.description || ""} onChange={(event) => updateItem(index, { description: event.target.value })} placeholder="Describe the item or specification" rows={3} className="mt-2 w-full rounded-lg border border-gray5 p-3 text-sm" /></label></fieldset>; })}<fieldset className="space-y-3 rounded-lg border border-gray5 bg-white p-4"><legend className="px-1 text-sm font-semibold text-gray1">Who receives this request</legend><div className="grid gap-3 sm:grid-cols-2"><RoutingChoice label="Match suppliers for me" description="Baiy routes the request to distributors that carry these items." active={routingMode === "automatic"} onClick={() => { setRoutingMode("automatic"); setDirectDistributorIds([]); }} /><RoutingChoice label="Choose distributors" description="Send only to the distributors you select below." active={routingMode === "direct"} onClick={() => setRoutingMode("direct")} /></div>{routingMode === "direct" ? <DistributorPicker selectedIds={directDistributorIds} onChange={setDirectDistributorIds} pinned={targetedDistributorId ? [{ _id: targetedDistributorId, name: targetedDistributorName || "This distributor" }] : undefined} /> : null}</fieldset><fieldset className="space-y-4"><label className="block text-sm text-gray1">Delivery address<select value={addressId} onChange={(event) => setAddressId(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-gray5 bg-white px-3"><option value="">Select saved address</option>{addresses.map((address) => <option key={address._id} value={address._id}>{addressLabel(address)}</option>)}</select></label>{addresses.length === 0 ? <p className="text-sm text-warning">You need a saved delivery address before submitting an RFQ.</p> : null}<Input id="rfq-timeline" label="Delivery timeline" placeholder="e.g. Within 2 weeks" value={deliveryTimeline} onValueChange={setDeliveryTimeline} /><label className="block text-sm text-gray1">Additional notes<textarea value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} placeholder="Enter notes for suppliers" rows={3} className="mt-2 w-full rounded-lg border border-gray5 p-3 text-sm" /></label><div className="text-sm text-gray1"><p>Attachments (optional)</p><label htmlFor="rfq-attachments" className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray5 bg-white px-4 py-4 text-sm font-medium text-primary transition-colors hover:bg-primary-light"><Upload size={18} />{attachments.length ? "Add more files" : "Upload files"}<input id="rfq-attachments" type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachments(Array.from(event.target.files ?? []).slice(0, 3))} className="hidden" /></label><span className="mt-1 block text-xs text-gray3">Up to 3 documents or images.</span></div>{attachments.length ? <div className="flex flex-wrap gap-2">{attachments.map((file) => <span key={file.name} className="inline-flex items-center gap-1 rounded bg-primary-light px-2 py-1 text-xs text-primary"><FileText size={13} />{file.name}</span>)}</div> : null}</fieldset>{error ? <p className="text-sm text-danger">{error}</p> : null}</div><footer className="border-t border-gray5 bg-white p-5"><Button title={createRfq.isPending ? "Submitting..." : "Submit request"} variant="primary" size="md" isBusy={createRfq.isPending} onClick={() => void submit()} className="w-full" /></footer></section></div> : null}
      {submitted ? <div className="fixed inset-0 z-[60] grid place-items-center bg-gray1/40 p-4"><section role="dialog" aria-modal="true" aria-label="RFQ submitted" className="w-full max-w-[400px] rounded-[30px] border-2 border-primary bg-white px-7 py-10 text-center shadow-xl"><ThumbsUp aria-hidden className="mx-auto size-11 text-success" strokeWidth={1.8} /><h2 className="mt-8 text-xl font-medium text-success">Congratulations</h2><p className="mt-4 text-base leading-6 text-gray1">You have successfully submitted a request for quote. You will be contacted shortly.</p><Button title="Okay" variant="primary" size="md" onClick={() => setSubmitted(false)} className="mx-auto mt-8 !w-[160px]" /></section></div> : null}
    </div>
  );
}

function RoutingChoice({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary-light/40" : "border-gray5 hover:bg-gray7"}`}>
      <span className="block text-sm font-medium text-gray1">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-gray3">{description}</span>
    </button>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-w-[150px] shrink-0 flex-1 border-b-2 px-5 py-4 text-base font-medium transition-colors md:px-5 ${active ? "border-primary text-primary" : "border-transparent text-gray3"}`}>{label}</button>;
}
