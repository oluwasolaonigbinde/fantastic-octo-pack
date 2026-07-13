"use client";

import { ChangeEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, FileText, Filter, MapPin, MessageCircle, PackageCheck, Send } from "lucide-react";
import Header from "../../component/header";
import { Button, EmptyState, Input, RightSlider, Skeleton } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDistributorInboxQuery, useRespondToQuoteMutation } from "@/hooks/queries/rfqs";
import { useMyProductsQuery } from "@/hooks/queries/products";
import { QUOTE_STATUS_LABELS, type Quote, type QuoteLineItem, type Rfq, type UserRef } from "@/types/rfq";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";

type OfferLine = { available: boolean; product: string; price: string; quantity: string; availableModel: string; notes: string };
type QuoteFilter = "all" | "responded" | "approved" | "declined";

const asRfq = (quote: Quote) => typeof quote.rfq === "object" && quote.rfq ? quote.rfq as Rfq : null;
const userId = (user: string | UserRef | undefined) => typeof user === "string" ? user : user?._id;
const buyerName = (rfq: Rfq | null) => !rfq || typeof rfq.buyer === "string" ? "Buyer" : `${(rfq.buyer as UserRef).firstName || ""} ${(rfq.buyer as UserRef).lastName || ""}`.trim() || "Buyer";
const deliveryLocation = (rfq: Rfq | null) => rfq?.deliveryAddress ? [rfq.deliveryAddress.city, rfq.deliveryAddress.state, rfq.deliveryAddress.country].filter(Boolean).join(", ") : "--";
const initialLines = (quote: Quote): Record<number, OfferLine> => Object.fromEntries((asRfq(quote)?.items ?? []).map((item, index) => [index, { available: true, product: "", price: "", quantity: String(item.quantity), availableModel: item.model || "", notes: "" }]));
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
  const respond = useRespondToQuoteMutation();
  const [selected, setSelected] = useState<Quote | null>(null);
  const [view, setView] = useState<"detail" | "respond">("detail");
  const [lines, setLines] = useState<Record<number, OfferLine>>({});
  const [warranty, setWarranty] = useState("");
  const [notes, setNotes] = useState("");
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

  const openQuote = (quote: Quote, nextView: "detail" | "respond" = "detail") => { setSelected(quote); setLines(initialLines(quote)); setWarranty(quote.warranty || ""); setNotes(quote.notes || ""); setImages([]); setCatalogue(undefined); setError(null); setView(nextView); };
  const close = () => { setSelected(null); setError(null); setView("detail"); };
  const updateLine = (index: number, update: Partial<OfferLine>) => setLines((current) => ({ ...current, [index]: { ...current[index], ...update } }));
  const applyFilters = () => { setAppliedFilters({ product: draftProduct, dateRange: draftDateRange }); setPage(1); };

  const submitResponse = async () => {
    if (!selected) return;
    const rfq = asRfq(selected);
    if (!rfq) { setError("This request is missing the RFQ line items required to respond."); return; }
    const payload: QuoteLineItem[] = rfq.items.map((item, index) => { const line = lines[index]; return { rfqItemIndex: index, available: line.available, product: line.available ? line.product : undefined, pricePerUnit: line.available ? Number(line.price) : undefined, quantity: line.available ? Number(line.quantity) : undefined, availableModel: line.available ? line.availableModel || undefined : undefined, notes: line.notes || undefined }; });
    if (payload.some((line) => line.available && (!line.product || !line.pricePerUnit || !line.quantity))) { setError("Choose one of your products, a price, and available quantity for every available line."); return; }
    setError(null);
    try { const result = await respond.mutateAsync({ quoteId: selected._id, data: { items: payload, warranty: warranty || undefined, notes: notes || undefined }, files: { images: images.length ? images : undefined, catalogue } }); await refetch(); close(); setNotice(result.message || "Quote sent to buyer."); window.setTimeout(() => setNotice(null), 3600); } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Unable to send the quote."); }
  };

  const rfq = selected ? asRfq(selected) : null;
  const sliderTitle = view === "respond" ? <div className="flex items-center gap-3"><button type="button" aria-label="Back to quote details" onClick={() => setView("detail")}><ArrowLeft size={22} /></button><span>Send Quote</span></div> : "Quote details";

  return <div className="min-h-full bg-gray7"><Header title="Quote Request" description="View all quote request from customers" /><main className="mx-auto max-w-[1160px] space-y-4 p-4 md:space-y-5 md:p-6">
    <div className="grid grid-cols-2 border-b border-gray5 text-sm md:text-base"><button type="button" onClick={() => { setMode("single"); setPage(1); }} className={`h-14 border-b-2 transition-colors ${mode === "single" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Single Quote</button><button type="button" onClick={() => { setMode("bulk"); setPage(1); }} className={`h-14 border-b-2 transition-colors ${mode === "bulk" ? "border-primary bg-primary text-white" : "border-transparent text-gray1"}`}>Bulk Quotes</button></div>
    <section className="rounded-2xl border border-gray5 bg-white p-5"><p className="text-3xl font-semibold leading-none text-gray1">{totalItems}</p><p className="mt-3 text-lg text-gray1">Total Item requested</p></section>
    <nav aria-label="Quote status" className="flex overflow-x-auto border-b border-gray5"><Tab label="All Quotes" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} /><Tab label="Responded" active={filter === "responded"} onClick={() => { setFilter("responded"); setPage(1); }} /><Tab label="Quotes Approved" active={filter === "approved"} onClick={() => { setFilter("approved"); setPage(1); }} /><Tab label="Quotes Declined" active={filter === "declined"} onClick={() => { setFilter("declined"); setPage(1); }} /></nav>
    <section className="rounded-xl border border-gray5 bg-white p-5 md:p-5"><h2 className="text-xl font-medium text-gray1">All Request</h2><p className="mt-1 text-sm text-gray2">Total list of all requested quotes for equipment and consumables</p><div className="mt-10"><p className="text-base font-medium text-gray1">Filter table list by:</p><div className="mt-5 grid gap-4 md:grid-cols-[250px_250px_250px]"><Input id="quote-search" label="Product name" placeholder="Enter product name" value={draftProduct} onValueChange={setDraftProduct} /><Input id="quote-date-range" label="Date" placeholder="YYYY-MM-DD - YYYY-MM-DD" value={draftDateRange} onValueChange={setDraftDateRange} /><Button title="Filter" variant="primaryLight" size="md" iconLeft={<Filter size={18} />} onClick={applyFilters} className="self-end" /></div></div>
    {isLoading ? <div className="mt-8 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : pageItems.length === 0 ? <EmptyState icon={<PackageCheck />} title="No quote requests" description="New category-matched requests will arrive here." /> : <div className="mt-10 overflow-x-auto"><table className="min-w-[850px] w-full text-left"><thead className="border-b border-gray6 text-sm text-gray3"><tr><th className="pb-5 font-medium">Quote ID</th><th className="pb-5 font-medium">Qty</th><th className="pb-5 font-medium">Buyer region</th><th className="pb-5 font-medium">Date of request</th><th className="pb-5 font-medium">Status</th><th className="pb-5 font-medium">Action</th></tr></thead><tbody>{pageItems.map((quote) => { const request = asRfq(quote); const chatHref = quote.status === "selected_for_order" ? buildMessagingComposeHref(auth?.role, userId(request?.buyer)) : null; return <tr key={quote._id} className="border-b border-gray6 last:border-0 text-sm"><td className="py-5 font-medium text-gray1">{quoteId(quote)}</td><td className="py-5 text-gray1">{request?.items.reduce((sum, item) => sum + item.quantity, 0) ?? "--"}</td><td className="py-5 text-gray1">{deliveryLocation(request)}</td><td className="py-5 text-gray1">{displayRequestDate(quote)}</td><td className={`py-5 font-medium ${quoteStatusClass(quote.status)}`}>{QUOTE_STATUS_LABELS[quote.status]}</td><td className="py-5">{quote.status === "pending_response" ? <button type="button" onClick={() => openQuote(quote, "respond")} className="inline-flex items-center gap-2 font-medium text-[#a66c43] hover:underline"><Send size={16} />Respond</button> : chatHref ? <Link href={chatHref} className="inline-flex items-center gap-2 font-medium text-fuchsia-500 hover:underline"><MessageCircle size={17} />Open chat</Link> : <button type="button" onClick={() => openQuote(quote)} className="inline-flex items-center gap-2 font-medium text-primary hover:underline"><Eye size={18} />View</button>}</td></tr>; })}</tbody></table></div>}
    <div className="mt-7 flex items-center gap-3 text-sm text-gray1"><span>Page</span><span className="grid size-11 place-items-center rounded-lg border border-gray5 bg-white">{Math.min(page, pageCount)}</span><span>of {pageCount}</span><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="ml-8 grid size-11 place-items-center rounded-lg border border-gray5 text-gray2 disabled:opacity-40"><ArrowLeft size={17} /></button><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="grid size-11 place-items-center rounded-lg bg-primary text-white disabled:opacity-40"><ArrowLeft size={17} className="rotate-180" /></button></div>
    </section></main><RightSlider open={Boolean(selected)} onClose={close} title={sliderTitle}>{selected && rfq ? view === "detail" ? <QuoteDetail quote={selected} rfq={rfq} onRespond={() => setView("respond")} /> : <QuoteResponseForm rfq={rfq} lines={lines} products={myProducts?.products ?? []} warranty={warranty} notes={notes} images={images} catalogue={catalogue} busy={respond.isPending} error={error} updateLine={updateLine} setWarranty={setWarranty} setNotes={setNotes} onImages={(event) => setImages(Array.from(event.target.files ?? []).slice(0, 3))} onCatalogue={(event) => setCatalogue(event.target.files?.[0])} onSubmit={() => void submitResponse()} /> : null}</RightSlider>{notice ? <div role="status" className="fixed bottom-6 right-6 z-50 rounded-lg bg-success px-4 py-3 text-sm text-white shadow-lg">{notice}</div> : null}</div>;
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`min-w-[170px] shrink-0 flex-1 border-b-2 px-5 py-4 text-base font-medium transition-colors md:px-5 ${active ? "border-primary text-primary" : "border-transparent text-gray3"}`}>{label}</button>; }

function QuoteDetail({ quote, rfq, onRespond }: { quote: Quote; rfq: Rfq; onRespond: () => void }) {
  const address = rfq.deliveryAddress ? [rfq.deliveryAddress.address, rfq.deliveryAddress.city, rfq.deliveryAddress.state].filter(Boolean).join(", ") : "No delivery address provided";
  return <div className="space-y-6"><section className="space-y-4"><div><p className="text-sm text-gray3">Buyer</p><p className="mt-1 font-medium text-gray1">{buyerName(rfq)}</p></div><div><p className="text-sm text-gray3">Delivery address</p><p className="mt-1 flex gap-2 text-sm text-gray1"><MapPin size={16} className="shrink-0 text-primary" />{address}</p></div><div><p className="text-sm text-gray3">Delivery timeline</p><p className="mt-1 text-sm text-gray1">{rfq.deliveryTimeline || "Not specified"}</p></div></section><section><h3 className="font-semibold text-gray1">Requested items</h3><div className="mt-3 space-y-3">{rfq.items.map((item, index) => <div key={`${item.productName}-${index}`} className="rounded-lg border border-gray5 p-4"><p className="font-medium text-gray1">{item.productName}</p><p className="mt-1 text-sm text-gray3">Quantity: {item.quantity} · {item.model || "No model specified"}</p>{item.description ? <p className="mt-2 text-sm text-gray2">{item.description}</p> : null}</div>)}</div></section>{rfq.attachments?.length ? <section><p className="mb-2 text-sm text-gray3">Attachments</p>{rfq.attachments.map((file) => <a key={file.cloudinary_id} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><FileText size={16} />{file.originalName || "Attachment"}</a>)}</section> : null}{quote.status === "pending_response" ? <Button title="Send Quote" variant="primary" size="md" onClick={onRespond} className="w-full" /> : <div className="rounded-lg bg-gray7 p-4 text-sm text-gray2">This request is {QUOTE_STATUS_LABELS[quote.status].toLowerCase()}.</div>}</div>;
}

function QuoteResponseForm({ rfq, lines, products, warranty, notes, images, catalogue, busy, error, updateLine, setWarranty, setNotes, onImages, onCatalogue, onSubmit }: { rfq: Rfq; lines: Record<number, OfferLine>; products: { _id: string; name: string }[]; warranty: string; notes: string; images: File[]; catalogue?: File; busy: boolean; error: string | null; updateLine: (index: number, update: Partial<OfferLine>) => void; setWarranty: (value: string) => void; setNotes: (value: string) => void; onImages: (event: ChangeEvent<HTMLInputElement>) => void; onCatalogue: (event: ChangeEvent<HTMLInputElement>) => void; onSubmit: () => void; }) {
  return <div className="space-y-6"><p className="text-sm text-gray3">Respond to every requested line. An unavailable line will be recorded clearly for the buyer.</p>{rfq.items.map((item, index) => { const line = lines[index]; return <section key={`${item.productName}-${index}`} className="space-y-4 rounded-lg border border-gray5 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray1">{item.productName}</h3><p className="text-sm text-gray3">Requested quantity: {item.quantity}</p></div><label className="inline-flex items-center gap-2 text-sm text-gray1"><input type="checkbox" checked={line?.available ?? true} onChange={(event) => updateLine(index, { available: event.target.checked })} />Available</label></div>{line?.available ? <div className="space-y-4"><label className="block text-sm text-gray1">Your product<select value={line.product} onChange={(event) => updateLine(index, { product: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-gray5 bg-white px-3"><option value="">Select your listed product</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><Input id={`quote-price-${index}`} label="Unit price" type="number" placeholder="Enter price" value={line.price} onValueChange={(value) => updateLine(index, { price: value })} /><Input id={`quote-quantity-${index}`} label="Available quantity" type="number" placeholder="Enter quantity" value={line.quantity} onValueChange={(value) => updateLine(index, { quantity: value })} /></div><Input id={`quote-model-${index}`} label="Available model (optional)" placeholder="Enter model" value={line.availableModel} onValueChange={(value) => updateLine(index, { availableModel: value })} /><label className="block text-sm text-gray1">Line note<textarea value={line.notes} onChange={(event) => updateLine(index, { notes: event.target.value })} rows={2} className="mt-2 w-full rounded-lg border border-gray5 p-3" /></label></div> : <p className="rounded-lg bg-danger-light p-3 text-sm text-danger">This item will be sent as unavailable.</p>}</section>; })}<Input id="quote-warranty" label="Warranty (optional)" placeholder="e.g. 12 months" value={warranty} onValueChange={setWarranty} /><label className="block text-sm text-gray1">Additional note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray5 p-3" /></label><label className="block text-sm text-gray1">Images (optional)<input type="file" multiple accept="image/png,image/jpeg" onChange={onImages} className="mt-2 block w-full text-sm" /></label>{images.length ? <p className="text-xs text-gray3">{images.map((file) => file.name).join(", ")}</p> : null}<label className="block text-sm text-gray1">Catalogue (optional)<input type="file" accept="application/pdf" onChange={onCatalogue} className="mt-2 block w-full text-sm" /></label>{catalogue ? <p className="text-xs text-gray3">{catalogue.name}</p> : null}{error ? <p className="text-sm text-danger">{error}</p> : null}<Button title={busy ? "Sending..." : "Send Quote"} variant="primary" size="md" isBusy={busy} onClick={onSubmit} className="w-full" /></div>;
}

export default function DistributorQuotesPage() { return <Suspense fallback={<div className="p-6 text-sm text-gray3">Loading...</div>}><DistributorQuotesPageInner /></Suspense>; }
