"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Eye, FileText, Filter, Info, MapPin, MessageCircle, PackageCheck, User } from "lucide-react";
import Header from "../../component/header";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, FileUpload, Input, Select, Skeleton } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDistributorInboxQuery, useRespondToQuoteMutation } from "@/hooks/queries/rfqs";
import { useMyProductsQuery } from "@/hooks/queries/products";
import { QUOTE_STATUS_LABELS, type Quote, type QuoteLineItem, type Rfq, type UserRef } from "@/types/rfq";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";

/** Per RFQ line the distributor is responding to. Mirrors the Figma respond modal. */
type OfferLine = { available: boolean; product: string; availableModel: string; price: string; stockCount: string };
type QuoteFilter = "all" | "responded" | "approved" | "declined";

const WARRANTY_OPTIONS = [
  { label: "No warranty", value: "No warranty" },
  { label: "1 month", value: "1 month" },
  { label: "3 months", value: "3 months" },
  { label: "6 months", value: "6 months" },
  { label: "1 year", value: "1 year" },
  { label: "2 years", value: "2 years" },
];
const STOCK_OPTIONS = [
  { label: "1 - 10 units", value: "10" },
  { label: "11 - 50 units", value: "50" },
  { label: "51 - 100 units", value: "100" },
  { label: "100+ units", value: "150" },
];

const money = (value?: number | null) => value == null ? "--" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);
const asRfq = (quote: Quote) => typeof quote.rfq === "object" && quote.rfq ? quote.rfq as Rfq : null;
const userId = (user: string | UserRef | undefined) => typeof user === "string" ? user : user?._id;
const buyerName = (rfq: Rfq | null) => !rfq || typeof rfq.buyer === "string" ? "Buyer" : `${(rfq.buyer as UserRef).firstName || ""} ${(rfq.buyer as UserRef).lastName || ""}`.trim() || "Buyer";
const deliveryLocation = (rfq: Rfq | null) => rfq?.deliveryAddress ? [rfq.deliveryAddress.address, rfq.deliveryAddress.city, rfq.deliveryAddress.state, rfq.deliveryAddress.country].filter(Boolean).join(", ") : "--";
const initialLines = (quote: Quote): Record<number, OfferLine> => Object.fromEntries((asRfq(quote)?.items ?? []).map((item, index) => [index, { available: true, product: "", availableModel: item.model || "", price: "", stockCount: "" }]));
const quoteStatusClass = (status: Quote["status"]) => {
  if (status === "quoted" || status === "selected_for_order") return "text-success";
  if (status === "rejected_by_buyer" || status === "not_selected") return "text-danger";
  if (status === "unavailable") return "text-[#fe6e00]";
  if (status === "expired" || status === "expired_no_response") return "text-gray3";
  return "text-primary";
};
const quoteId = (quote: Quote) => {
  const rfq = asRfq(quote);
  const raw = rfq?._id || quote._id;
  return raw.toUpperCase().startsWith("RFQ-") ? raw.toUpperCase() : `RFQ-${raw.slice(-8).toUpperCase()}`;
};
const requestDate = (quote: Quote) => new Date(asRfq(quote)?.createdAt || quote.createdAt);
const displayRequestDate = (quote: Quote) => requestDate(quote).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

function DistributorQuotesPageInner() {
  const auth = useAppSelector((state) => state.auth.data);
  const { data: inbox = [], isLoading, refetch } = useDistributorInboxQuery();
  const { data: myProducts } = useMyProductsQuery(auth?._id, { enabled: Boolean(auth?._id) });
  // Free (unreserved) on-hand stock per product. A distributor can only quote
  // what they can fulfil, so out-of-stock products are hidden from the picker
  // and quoted quantities are capped to this — otherwise the order fails later
  // at payment with "Insufficient stock".
  const productFreeStock = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of myProducts?.products ?? []) {
      map.set(product._id, Number(product.quantityAvailable ?? 0) - Number(product.quantityReserved ?? 0));
    }
    return map;
  }, [myProducts]);
  const productOptions = useMemo(() => (myProducts?.products ?? [])
    .filter((product: { _id: string }) => (productFreeStock.get(product._id) ?? 0) > 0)
    .map((product: { _id: string; name: string }) => ({ label: product.name, value: product._id })), [myProducts, productFreeStock]);
  const respond = useRespondToQuoteMutation();
  const [selected, setSelected] = useState<Quote | null>(null);
  const [view, setView] = useState<"detail" | "respond" | "bulk">("detail");
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [itemStatus, setItemStatus] = useState<Record<number, "quoted" | "unavailable">>({});
  const [bulkStep, setBulkStep] = useState<"items" | "finalize">("items");
  const [lines, setLines] = useState<Record<number, OfferLine>>({});
  const [warranty, setWarranty] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [catalogue, setCatalogue] = useState<File | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [filter, setFilter] = useState<QuoteFilter>("all");
  const [draftProduct, setDraftProduct] = useState("");
  const [draftDateRange, setDraftDateRange] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ product: "", dateRange: "" });
  const [page, setPage] = useState(1);

  // Extract files while the input change event is still active. Passing a
  // synthetic event through several components made the upload flow fragile
  // and is unnecessary now that the form only needs the selected files.
  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    setImages(Array.from(event.currentTarget.files ?? []).slice(0, 4));
  };

  const typeScoped = useMemo(() => inbox.filter((quote) => asRfq(quote)?.isBulk === (mode === "bulk")), [inbox, mode]);
  const filtered = useMemo(() => {
    const [from = "", to = ""] = appliedFilters.dateRange.split(/\s+-\s+/).map((value) => value.trim());
    return typeScoped.filter((quote) => {
    const rfq = asRfq(quote);
    const productName = rfq?.items.map((item) => item.productName).join(" ") || "";
    const date = requestDate(quote).toISOString().slice(0, 10);
    const statusMatches = filter === "all" || (filter === "responded" && ["quoted", "unavailable"].includes(quote.status)) || (filter === "approved" && quote.status === "selected_for_order") || (filter === "declined" && ["rejected_by_buyer", "not_selected"].includes(quote.status));
    return statusMatches && productName.toLowerCase().includes(appliedFilters.product.toLowerCase()) && (!from || date >= from) && (!to || date <= to);
  });
  }, [appliedFilters, filter, typeScoped]);
  const totalItems = useMemo(() => typeScoped.reduce((total, quote) => total + (asRfq(quote)?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0), 0), [typeScoped]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pageItems = filtered.slice((Math.min(page, pageCount) - 1) * 10, Math.min(page, pageCount) * 10);

  const openQuote = (quote: Quote) => {
    const request = asRfq(quote);
    const bulk = Boolean(request?.isBulk) && quote.status === "pending_response";
    setSelected(quote); setLines(initialLines(quote)); setWarranty(quote.warranty || ""); setDeliveryTime(""); setImages([]); setCatalogue(undefined); setError(null);
    setItemStatus({}); setEditingItem(null); setBulkStep("items");
    setView(bulk ? "bulk" : "detail");
  };
  const close = () => { setSelected(null); setError(null); setView("detail"); setEditingItem(null); setItemStatus({}); setBulkStep("items"); };
  const updateLine = (index: number, update: Partial<OfferLine>) => setLines((current) => ({ ...current, [index]: { ...current[index], ...update } }));

  const startQuoteItem = (index: number) => { updateLine(index, { available: true }); setError(null); setEditingItem(index); };
  const markItemUnavailable = (index: number) => { updateLine(index, { available: false }); setItemStatus((current) => ({ ...current, [index]: "unavailable" })); if (editingItem === index) setEditingItem(null); };
  // The Stock Count field is a coarse band ("1 - 10 units"), not an exact
  // count, so its value is the band's upper bound. The actual quantity the
  // distributor can fulfil is capped to their real free stock — never the
  // band ceiling — otherwise a true stock of 7 fails the "1 - 10" band even
  // though 7 falls inside it.
  const offeredQuantity = (line?: OfferLine): number => {
    if (!line?.product || !line.stockCount) return 0;
    const free = productFreeStock.get(line.product) ?? 0;
    return Math.min(Number(line.stockCount), free);
  };

  const saveQuoteItem = (index: number) => { const line = lines[index]; if (!line?.product || !line.price || !line.stockCount) { setError("Select the product, price, and stock count for this item."); return; } if (offeredQuantity(line) <= 0) { const name = productOptions.find((option) => option.value === line.product)?.label ?? "this product"; setError(`"${name}" has no free stock available to quote.`); return; } setItemStatus((current) => ({ ...current, [index]: "quoted" })); setError(null); setEditingItem(null); };
  const applyFilters = () => { setAppliedFilters({ product: draftProduct, dateRange: draftDateRange }); setPage(1); };

  const sendResponse = async (payload: QuoteLineItem[], withFiles: boolean) => {
    if (!selected) return;
    setError(null);
    try {
      const notes = deliveryTime.trim() ? `Delivery time: ${deliveryTime.trim()}` : undefined;
      const result = await respond.mutateAsync({ quoteId: selected._id, data: { items: payload, warranty: warranty || undefined, notes }, files: withFiles ? { images: images.length ? images : undefined, catalogue } : undefined });
      await refetch();
      close();
      setNotice(result.message || "Quote sent to buyer.");
      window.setTimeout(() => setNotice(null), 3600);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to send the quote.");
    }
  };

  const submitResponse = async () => {
    const rfq = selected ? asRfq(selected) : null;
    if (!rfq) { setError("This request is missing the RFQ line items required to respond."); return; }
    const payload: QuoteLineItem[] = rfq.items.map((item, index) => { const line = lines[index]; return { rfqItemIndex: index, available: line.available, product: line.available ? line.product || undefined : undefined, pricePerUnit: line.available ? Number(line.price) : undefined, quantity: line.available ? offeredQuantity(line) : undefined, availableModel: line.available ? line.availableModel || undefined : undefined }; });
    if (payload.some((line) => line.available && (!line.product || !line.pricePerUnit || !line.quantity))) { setError("Select the product from your catalogue, a price, and stock count for every available item."); return; }
    await sendResponse(payload, true);
  };

  const markUnavailable = async () => {
    const rfq = selected ? asRfq(selected) : null;
    if (!rfq) return;
    const payload: QuoteLineItem[] = rfq.items.map((_, index) => ({ rfqItemIndex: index, available: false }));
    await sendResponse(payload, false);
  };

  const rfq = selected ? asRfq(selected) : null;

  return <div className="min-h-full bg-gray7"><Header title="Quote Request" description="View all quote request from customers" /><main className="mx-auto max-w-[1160px] space-y-4 p-4 md:space-y-5 md:p-6">
    <div className="grid grid-cols-2 border-b border-gray5 text-sm md:text-base"><button type="button" onClick={() => { setMode("single"); setPage(1); }} className={`h-14 border-b-2 transition-colors ${mode === "single" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Single Quote</button><button type="button" onClick={() => { setMode("bulk"); setPage(1); }} className={`h-14 border-b-2 transition-colors ${mode === "bulk" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Bulk Quotes</button></div>
    <section className="rounded-2xl border border-gray5 bg-white p-5"><p className="text-3xl font-semibold leading-none text-gray1">{totalItems}</p><p className="mt-3 text-lg text-gray1">Total Item requested</p></section>
    <nav aria-label="Quote status" className="flex overflow-x-auto border-b border-gray5"><Tab label="All Quotes" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} /><Tab label="Responded" active={filter === "responded"} onClick={() => { setFilter("responded"); setPage(1); }} /><Tab label="Quotes Approved" active={filter === "approved"} onClick={() => { setFilter("approved"); setPage(1); }} /><Tab label="Quotes Declined" active={filter === "declined"} onClick={() => { setFilter("declined"); setPage(1); }} /></nav>
    <section className="rounded-xl border border-gray5 bg-white p-5 md:p-5"><h2 className="text-xl font-medium text-gray1">All Request</h2><p className="mt-1 text-sm text-gray2">Total list of all requested quotes for equipment and consumables</p><div className="mt-10"><p className="text-base font-medium text-gray1">Filter table list by:</p><div className="mt-5 grid gap-4 md:grid-cols-[250px_250px_250px]"><Input id="quote-search" label="Product name" placeholder="Enter product name" value={draftProduct} onValueChange={setDraftProduct} /><Input id="quote-date-range" label="Date" placeholder="YYYY-MM-DD - YYYY-MM-DD" value={draftDateRange} onValueChange={setDraftDateRange} /><Button title="Filter" variant="primaryLight" size="md" iconLeft={<Filter size={18} />} onClick={applyFilters} className="self-end" /></div></div>
    {isLoading ? <div className="mt-8 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : pageItems.length === 0 ? <EmptyState icon={<PackageCheck />} title="No quote requests" description="New category-matched requests will arrive here." /> : <>
      <div className="mt-10 hidden overflow-x-auto md:block"><table className="min-w-[850px] w-full text-left"><thead className="border-b border-gray6 text-sm text-gray3"><tr><th className="pb-5 font-medium">Quote ID</th><th className="pb-5 font-medium">Qty</th><th className="pb-5 font-medium">Buyer region</th><th className="pb-5 font-medium">Date of request</th><th className="pb-5 font-medium">Status</th><th className="pb-5 font-medium">Action</th></tr></thead><tbody>{pageItems.map((quote) => { const request = asRfq(quote); const chatHref = quote.status === "selected_for_order" ? buildMessagingComposeHref(auth?.role, userId(request?.buyer)) : null; return <tr key={quote._id} className="border-b border-gray6 last:border-0 text-sm"><td className="py-5 font-medium text-gray1">{quoteId(quote)}</td><td className="py-5 text-gray1">{request?.items.reduce((sum, item) => sum + item.quantity, 0) ?? "--"}</td><td className="py-5 text-gray1">{deliveryLocation(request)}</td><td className="py-5 text-gray1">{displayRequestDate(quote)}</td><td className={`py-5 font-medium ${quoteStatusClass(quote.status)}`}>{QUOTE_STATUS_LABELS[quote.status]}</td><td className="py-5">{chatHref ? <Link href={chatHref} className="inline-flex items-center gap-2 font-medium text-fuchsia-500 hover:underline"><MessageCircle size={17} />Open chat</Link> : <button type="button" onClick={() => openQuote(quote)} className="inline-flex items-center gap-2 font-medium text-primary hover:underline"><Eye size={18} />View</button>}</td></tr>; })}</tbody></table></div>
      <ul className="mt-8 space-y-4 md:hidden">{pageItems.map((quote) => { const request = asRfq(quote); const chatHref = quote.status === "selected_for_order" ? buildMessagingComposeHref(auth?.role, userId(request?.buyer)) : null; const card = <div className="rounded-xl border border-gray5 bg-white p-4"><div className="flex items-center justify-between border-b border-gray6 pb-3"><span className="text-base font-semibold text-gray1">{buyerName(request)}</span><ChevronRight size={18} className="shrink-0 text-gray2" /></div><dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm"><div><dt className="text-xs uppercase tracking-wide text-gray3">Buyer region</dt><dd className="mt-1 font-medium text-gray1">{deliveryLocation(request)}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray3">Status</dt><dd className={`mt-1 font-medium ${quoteStatusClass(quote.status)}`}>{QUOTE_STATUS_LABELS[quote.status]}</dd></div><div className="col-span-2"><dt className="text-xs uppercase tracking-wide text-gray3">Request date</dt><dd className="mt-1 font-medium text-gray1">{displayRequestDate(quote)}</dd></div></dl></div>; return <li key={quote._id}>{chatHref ? <Link href={chatHref} className="block">{card}</Link> : <button type="button" onClick={() => openQuote(quote)} className="block w-full text-left">{card}</button>}</li>; })}</ul>
    </>}
    <div className="mt-7 flex items-center gap-3 text-sm text-gray1"><span>Page</span><span className="grid size-11 place-items-center rounded-lg border border-gray5 bg-white">{Math.min(page, pageCount)}</span><span>of {pageCount}</span><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="ml-8 grid size-11 place-items-center rounded-lg border border-gray5 text-gray2 disabled:opacity-40"><ArrowLeft size={17} /></button><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="grid size-11 place-items-center rounded-lg bg-primary text-white disabled:opacity-40"><ArrowLeft size={17} className="rotate-180" /></button></div>
    </section></main>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-[520px] gap-0 p-0">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-gray5 px-6 py-4 text-left">
          <DialogTitle className="text-xl font-semibold text-gray1">{view === "bulk" ? "Bulk RFQ Details" : "Quote Details"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
          {selected && rfq ? (
            view === "bulk"
              ? <BulkRespond rfq={rfq} lines={lines} itemStatus={itemStatus} editingItem={editingItem} bulkStep={bulkStep} productOptions={productOptions} warranty={warranty} deliveryTime={deliveryTime} images={images} catalogue={catalogue} busy={respond.isPending} error={error} buyerLabel={buyerName(rfq)} deliveryLoc={deliveryLocation(rfq)} onStartItem={startQuoteItem} onMarkUnavailable={markItemUnavailable} onUpdateLine={updateLine} onSaveItem={saveQuoteItem} onCancelItem={() => { setEditingItem(null); setError(null); }} onGoFinalize={() => { setError(null); setBulkStep("finalize"); }} onBackToItems={() => { setError(null); setBulkStep("items"); }} setWarranty={setWarranty} setDeliveryTime={setDeliveryTime} onImages={selectImages} onCatalogue={(event) => setCatalogue(event.currentTarget.files?.[0])} onSend={() => void submitResponse()} />
              : view === "detail"
              ? <QuoteDetail quote={selected} rfq={rfq} busy={respond.isPending} error={error} onRespond={() => { setError(null); setView("respond"); }} onUnavailable={() => void markUnavailable()} />
              : <QuoteResponseForm rfq={rfq} lines={lines} productOptions={productOptions} warranty={warranty} deliveryTime={deliveryTime} images={images} catalogue={catalogue} busy={respond.isPending} error={error} updateLine={updateLine} setWarranty={setWarranty} setDeliveryTime={setDeliveryTime} onImages={selectImages} onCatalogue={(event) => setCatalogue(event.currentTarget.files?.[0])} onSubmit={() => void submitResponse()} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    {notice ? <div role="status" className="fixed bottom-6 right-6 z-50 rounded-lg bg-success px-4 py-3 text-sm text-white shadow-lg">{notice}</div> : null}</div>;
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`min-w-[170px] shrink-0 flex-1 border-b-2 px-5 py-4 text-base font-medium transition-colors md:px-5 ${active ? "border-primary text-primary" : "border-transparent text-gray3"}`}>{label}</button>; }

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="text-sm text-gray3">{label}</p><div className="mt-1 text-base text-gray1">{children}</div></div>; }

function QuoteDetail({ quote, rfq, busy, error, onRespond, onUnavailable }: { quote: Quote; rfq: Rfq; busy: boolean; error: string | null; onRespond: () => void; onUnavailable: () => void }) {
  const pending = quote.status === "pending_response";
  return <div className="space-y-5">
    {rfq.items.map((item, index) => <div key={`${item.productName}-${index}`} className="space-y-5">
      <Field label="Product name">{item.productName}</Field>
      <Field label="Model">{item.model || "Not specified"}</Field>
      <Field label="Quantity">{item.quantity}</Field>
      {item.description ? <Field label="Description"><p className="whitespace-pre-line leading-relaxed">{item.description}</p></Field> : null}
    </div>)}
    <Field label="Delivery location"><span className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" />{deliveryLocation(rfq)}</span></Field>
    {rfq.attachments?.length ? <div><p className="text-sm text-gray3">Attachment</p><div className="mt-2 space-y-2">{rfq.attachments.map((file) => <div key={file.cloudinary_id} className="flex items-center justify-between gap-3"><span className="flex items-center gap-3 text-sm text-gray1"><span className="grid size-10 place-items-center rounded-lg bg-success-light text-success"><FileText size={18} /></span>{file.originalName || "Attachment"}</span><a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Eye size={16} />View</a></div>)}</div></div> : null}
    {error ? <p className="text-sm text-danger">{error}</p> : null}
    {pending ? <div className="space-y-3 pt-2">
      <Button title="Respond to Quote" variant="primary" size="lg" onClick={onRespond} className="w-full" />
      <Button title={busy ? "Sending..." : "Not Available"} variant="primaryLight" size="lg" isBusy={busy} disabled={busy} onClick={onUnavailable} className="w-full" />
    </div> : <div className="space-y-4">
      <div className="rounded-lg bg-gray7 p-4 text-sm text-gray2">This request is {QUOTE_STATUS_LABELS[quote.status].toLowerCase()}.</div>
      {quote.items.length ? <div className="space-y-3">
        <p className="text-sm font-semibold text-gray1">Your response</p>
        {rfq.items.map((item, index) => { const line = quote.items.find((entry) => entry.rfqItemIndex === index); return <div key={`response-${index}`} className="rounded-lg border border-gray5 p-3 text-sm">
          <div className="flex items-center justify-between gap-3"><span className="font-medium text-gray1">{item.productName}</span><span className={line?.available ? "text-success" : "text-[#fe6e00]"}>{line?.available ? "Available" : "Unavailable"}</span></div>
          {line?.available ? <dl className="mt-2 grid grid-cols-3 gap-2"><div><dt className="text-xs text-gray3">Price</dt><dd className="text-gray1">{money(line.pricePerUnit)}</dd></div><div><dt className="text-xs text-gray3">Qty</dt><dd className="text-gray1">{line.quantity ?? "--"}</dd></div><div><dt className="text-xs text-gray3">Model</dt><dd className="text-gray1">{line.availableModel || "--"}</dd></div></dl> : null}
        </div>; })}
        <div className="flex items-center justify-between border-t border-gray6 pt-3"><span className="text-sm text-gray3">Total</span><span className="text-base font-semibold text-gray1">{money(quote.totalPrice)}</span></div>
        {quote.warranty ? <Field label="Warranty">{quote.warranty}</Field> : null}
        {quote.notes ? <Field label="Notes"><p className="whitespace-pre-line">{quote.notes}</p></Field> : null}
      </div> : null}
    </div>}
  </div>;
}

function QuoteResponseForm({ rfq, lines, productOptions, warranty, deliveryTime, images, catalogue, busy, error, updateLine, setWarranty, setDeliveryTime, onImages, onCatalogue, onSubmit }: { rfq: Rfq; lines: Record<number, OfferLine>; productOptions: { label: string; value: string }[]; warranty: string; deliveryTime: string; images: File[]; catalogue?: File; busy: boolean; error: string | null; updateLine: (index: number, update: Partial<OfferLine>) => void; setWarranty: (value: string) => void; setDeliveryTime: (value: string) => void; onImages: (event: ChangeEvent<HTMLInputElement>) => void; onCatalogue: (event: ChangeEvent<HTMLInputElement>) => void; onSubmit: () => void; }) {
  const hasAvailable = rfq.items.some((_, index) => lines[index]?.available ?? true);
  return <div className="space-y-6">
    {rfq.items.map((item, index) => { const line = lines[index]; const available = line?.available ?? true; return <section key={`${item.productName}-${index}`} className="space-y-4">
      {rfq.items.length > 1 ? <p className="text-sm font-semibold text-gray1">{item.productName}</p> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm text-gray1">Is the requested model available?</legend>
        <ModelRadio name={`avail-${index}`} checked={available} onChange={() => updateLine(index, { available: true })} label="Yes, I have the requested model" />
        <ModelRadio name={`avail-${index}`} checked={!available} onChange={() => updateLine(index, { available: false })} label="No, I don't have the requested model" />
      </fieldset>
      <div className="flex gap-2 rounded-lg bg-primary-light p-4"><Info size={18} className="mt-0.5 shrink-0 text-primary" /><div className="text-sm"><p className="font-medium text-primary">Requested Model</p><p className="mt-0.5 text-gray1">{item.model || "No model specified"}</p></div></div>
      {available ? <div className="space-y-4">
        <Select label="Product from your catalogue" placeholder={productOptions.length ? "Select the product you're quoting" : "No products in your catalogue yet"} options={productOptions} value={line.product} onValueChange={(value) => updateLine(index, { product: value })} />
        <Input id={`quote-model-${index}`} label="Available model" placeholder="Enter model" value={line.availableModel} onValueChange={(value) => updateLine(index, { availableModel: value })} />
        <Input id={`quote-price-${index}`} label="Price ₦" type="number" placeholder="Enter price" value={line.price} onValueChange={(value) => updateLine(index, { price: value })} />
        <Select label="Stock Count" placeholder="Select option" options={STOCK_OPTIONS} value={line.stockCount} onValueChange={(value) => updateLine(index, { stockCount: value })} />
      </div> : <p className="rounded-lg bg-danger-light p-3 text-sm text-danger">This item will be sent to the buyer as unavailable.</p>}
    </section>; })}
    {hasAvailable ? <>
      <Select label="Warranty" placeholder="Select option" options={WARRANTY_OPTIONS} value={warranty} onValueChange={setWarranty} />
      <Input id="quote-delivery-time" label="Delivery time" placeholder="How long would it take you to deliver this item" value={deliveryTime} onValueChange={setDeliveryTime} />
      <QuoteImageUpload id="quote-images" label="Upload pictures of the item" images={images} onChange={onImages} />
      <div><FileUpload id="quote-catalogue" label="Upload PDF catalogue (Optional)" accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx" onChange={onCatalogue} />{catalogue ? <p className="mt-2 px-3 text-xs text-gray3">{catalogue.name}</p> : null}</div>
    </> : null}
    {error ? <p className="text-sm text-danger">{error}</p> : null}
    <Button title={busy ? "Sending..." : "Send Quote"} variant="primary" size="lg" isBusy={busy} disabled={busy} onClick={onSubmit} className="w-full" />
  </div>;
}

function QuoteImageUpload({ id, label, images, onChange }: {
  id: string;
  label: string;
  images: File[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const previews = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images],
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  return <div>
    <FileUpload id={id} label={label} accept="image/png,image/jpeg,image/webp" multiple onChange={onChange} />
    {images.length ? <div className="mt-3 grid grid-cols-4 gap-2 px-3" aria-label="Selected quote images">
      {images.map((image, index) => <figure key={`${image.name}-${image.lastModified}-${index}`} className="min-w-0">
        {previews[index] ? <img src={previews[index]} alt={`Selected image: ${image.name}`} className="aspect-square w-full rounded-lg border border-gray5 object-cover" /> : null}
        <figcaption className="mt-1 truncate text-xs text-gray3" title={image.name}>{image.name}</figcaption>
      </figure>)}
    </div> : null}
  </div>;
}

function BulkRespond({ rfq, lines, itemStatus, editingItem, bulkStep, productOptions, warranty, deliveryTime, images, catalogue, busy, error, buyerLabel, deliveryLoc, onStartItem, onMarkUnavailable, onUpdateLine, onSaveItem, onCancelItem, onGoFinalize, onBackToItems, setWarranty, setDeliveryTime, onImages, onCatalogue, onSend }: {
  rfq: Rfq; lines: Record<number, OfferLine>; itemStatus: Record<number, "quoted" | "unavailable">; editingItem: number | null; bulkStep: "items" | "finalize"; productOptions: { label: string; value: string }[]; warranty: string; deliveryTime: string; images: File[]; catalogue?: File; busy: boolean; error: string | null; buyerLabel: string; deliveryLoc: string;
  onStartItem: (index: number) => void; onMarkUnavailable: (index: number) => void; onUpdateLine: (index: number, update: Partial<OfferLine>) => void; onSaveItem: (index: number) => void; onCancelItem: () => void; onGoFinalize: () => void; onBackToItems: () => void; setWarranty: (value: string) => void; setDeliveryTime: (value: string) => void; onImages: (event: ChangeEvent<HTMLInputElement>) => void; onCatalogue: (event: ChangeEvent<HTMLInputElement>) => void; onSend: () => void;
}) {
  const addressedCount = rfq.items.filter((_, index) => itemStatus[index]).length;
  const allAddressed = addressedCount === rfq.items.length;

  // Per-item quote form
  if (editingItem !== null) {
    const item = rfq.items[editingItem];
    const line = lines[editingItem];
    return <div className="space-y-4">
      <button type="button" onClick={onCancelItem} className="inline-flex items-center gap-1 text-sm font-medium text-gray3 hover:text-gray1"><ArrowLeft size={15} />Back to items</button>
      <p className="text-sm font-semibold text-gray1">Item {editingItem + 1}: {item.productName}</p>
      <div className="flex gap-2 rounded-lg bg-primary-light p-4"><Info size={18} className="mt-0.5 shrink-0 text-primary" /><div className="text-sm"><p className="font-medium text-primary">Requested Model</p><p className="mt-0.5 text-gray1">{item.model || "No model specified"}</p></div></div>
      <Select label="Product from your catalogue" placeholder={productOptions.length ? "Select the product you're quoting" : "No products in your catalogue yet"} options={productOptions} value={line?.product || ""} onValueChange={(value) => onUpdateLine(editingItem, { product: value })} />
      <Input id={`bulk-model-${editingItem}`} label="Available model" placeholder="Enter model" value={line?.availableModel || ""} onValueChange={(value) => onUpdateLine(editingItem, { availableModel: value })} />
      <Input id={`bulk-price-${editingItem}`} label="Price ₦" type="number" placeholder="Enter price" value={line?.price || ""} onValueChange={(value) => onUpdateLine(editingItem, { price: value })} />
      <Select label="Stock Count" placeholder="Select option" options={STOCK_OPTIONS} value={line?.stockCount || ""} onValueChange={(value) => onUpdateLine(editingItem, { stockCount: value })} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button title="Save item" variant="primary" size="lg" onClick={() => onSaveItem(editingItem)} className="w-full" />
    </div>;
  }

  // Warranty / delivery / images, then send
  if (bulkStep === "finalize") {
    return <div className="space-y-5">
      <button type="button" onClick={onBackToItems} className="inline-flex items-center gap-1 text-sm font-medium text-gray3 hover:text-gray1"><ArrowLeft size={15} />Back to items</button>
      <p className="text-sm text-gray2">These apply to the whole quote.</p>
      <Select label="Warranty" placeholder="Select option" options={WARRANTY_OPTIONS} value={warranty} onValueChange={setWarranty} />
      <Input id="bulk-delivery-time" label="Delivery time" placeholder="How long would it take you to deliver these items" value={deliveryTime} onValueChange={setDeliveryTime} />
      <QuoteImageUpload id="bulk-images" label="Upload pictures of the items" images={images} onChange={onImages} />
      <div><FileUpload id="bulk-catalogue" label="Upload PDF catalogue (Optional)" accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx" onChange={onCatalogue} />{catalogue ? <p className="mt-2 px-3 text-xs text-gray3">{catalogue.name}</p> : null}</div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button title={busy ? "Sending..." : "Send bulk quote"} variant="primary" size="lg" isBusy={busy} disabled={busy} onClick={onSend} className="w-full" />
    </div>;
  }

  // Item cards
  return <div className="space-y-5">
    <div className="flex items-center gap-3 border-b border-gray5 pb-4"><span className="grid size-10 place-items-center rounded-lg bg-primary-light text-primary"><User size={20} /></span><span className="text-lg font-semibold text-gray1">{buyerLabel}</span></div>
    <Field label="Delivery Address"><span className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" />{deliveryLoc}</span></Field>
    <p className="text-sm font-medium text-gray1">{addressedCount} of {rfq.items.length} item{rfq.items.length === 1 ? "" : "s"} addressed</p>
    {rfq.items.map((item, index) => { const status = itemStatus[index]; return <div key={`bulk-item-${index}`} className="space-y-3 rounded-xl border border-gray5 p-4">
      <div className="flex items-center justify-between border-b border-gray6 pb-3"><p className="font-medium text-gray1">Item {index + 1} of {rfq.items.length}</p>{status === "quoted" ? <span className="text-sm font-medium text-success">✓ Quoted</span> : status === "unavailable" ? <span className="text-sm font-medium text-[#fe6e00]">Not available</span> : null}</div>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3"><dt className="text-gray3">Product</dt><dd className="text-right font-medium text-gray1">{item.productName}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="text-gray3">Model</dt><dd className="text-right text-gray1">{item.model || "--"}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="text-gray3">Quantity</dt><dd className="text-right text-gray1">{item.quantity}</dd></div>
      </dl>
      <div className="grid grid-cols-2 gap-3">
        <Button title={status === "quoted" ? "Edit quote" : "Quote this item"} variant="primary" size="md" onClick={() => onStartItem(index)} />
        <Button title="Mark as Not available" variant="primaryLight" size="md" onClick={() => onMarkUnavailable(index)} className={status === "unavailable" ? "!border-[#fe6e00] !text-[#fe6e00]" : ""} />
      </div>
    </div>; })}
    {error ? <p className="text-sm text-danger">{error}</p> : null}
    <Button title="Continue to send" variant="primary" size="lg" disabled={!allAddressed} onClick={onGoFinalize} className="w-full" />
    {!allAddressed ? <p className="text-center text-xs text-gray3">Quote or mark every item to continue.</p> : null}
  </div>;
}

function ModelRadio({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${checked ? "border-primary bg-primary-light/40 text-gray1" : "border-gray5 text-gray1"}`}>
    <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4 accent-primary" />
    {label}
  </label>;
}

export default function DistributorQuotesPage() { return <Suspense fallback={<div className="p-6 text-sm text-gray3">Loading...</div>}><DistributorQuotesPageInner /></Suspense>; }
