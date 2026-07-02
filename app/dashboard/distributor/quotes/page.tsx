"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import Header from "../../component/header";
import {
  Button,
  EmptyState,
  FileUpload,
  Input,
  Select,
  Skeleton,
} from "@/components/base";
import { RightSlider } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select as ItemScopeSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Popover from "@radix-ui/react-popover";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDistributorInboxQuery } from "@/hooks/queries/rfqs";
import { QUOTE_STATUS_LABELS } from "@/types/rfq";
import type { Quote, Rfq, UserRef, ProductRef } from "@/types/rfq";
import rfqService from "@/services/rfqService";
import { BulkRfqSourcePanel } from "@/components/distributor/bulk-rfq-source-panel";

// ─── Sub-components ────────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray2">{label}</span>
      <span className="text-base text-gray1">{value}</span>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STOCK_STATUS_OPTIONS = [
  { label: "In Stock", value: "in_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
  { label: "Limited Stock", value: "limited" },
  { label: "On Order", value: "on_order" },
];

const PAGE_SIZE = 10;

type ItemScope = "all" | "bulk" | "standard";

// ─── Page ───────────────────────────────────────────────────────────────────────

function DistributorQuotesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authData } = useAppSelector((state) => state.auth);
  const {
    data: distributorQuotes,
    isLoading,
    refetch: refetchInbox,
  } = useDistributorInboxQuery();

  // ── Table / filter state ──────────────────────────────────────────────────
  const [productNameFilter, setProductNameFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [itemScope, setItemScope] = useState<ItemScope>("all");
  const [page, setPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [bulkSourceOpen, setBulkSourceOpen] = useState(false);

  // ── Slider view ───────────────────────────────────────────────────────────
  const [sliderView, setSliderView] = useState<"detail" | "form">("detail");

  // ── Send Quote form state ─────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [availableModel, setAvailableModel] = useState("");
  const [warranty, setWarranty] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [catalogue, setCatalogue] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingUnavailable, setIsMarkingUnavailable] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  useEffect(() => {
    if (searchParams.get("bulk") === "1") {
      setBulkSourceOpen(true);
      router.replace("/dashboard/distributor/quotes", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    setPage(1);
  }, [productNameFilter, dateFrom, dateTo, itemScope]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setPrice("");
    setAvailableModel("");
    setWarranty("");
    setDeliveryTime("");
    setStockStatus("");
    setImages([]);
    setCatalogue(null);
    setFormMessage(null);
    setFormError(null);
  }, []);

  const handleCloseSlider = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedQuote(null);
    setSliderView("detail");
    resetForm();
  }, [resetForm]);

  const handleApplyFilters = useCallback(() => {
    setIsDatePickerOpen(false);
    setPage(1);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleMarkUnavailable = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !selectedQuote) return;
    setIsMarkingUnavailable(true);
    setFormMessage(null);
    setFormError(null);
    setToastMessage(null);
    try {
      const result = await rfqService.respondToQuote(authData.tokens.accessToken, selectedQuote._id, {
        response: "unavailable",
      });
      await refetchInbox();
      setToastMessage(result.message || "Offer marked as unavailable.");
      handleCloseSlider();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to update offer status. Please try again.",
      );
      // silent – no error-handling infrastructure in this page
    } finally {
      setIsMarkingUnavailable(false);
    }
  }, [authData, selectedQuote, refetchInbox, handleCloseSlider]);

  const handleSendOffer = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !selectedQuote || !price) return;
    setIsSubmitting(true);
    setFormMessage(null);
    setFormError(null);
    setToastMessage(null);
    try {
      const result = await rfqService.respondToQuote(
        authData.tokens.accessToken,
        selectedQuote._id,
        {
          response: "quoted",
          pricePerUnit: parseFloat(price),
          availableModel: availableModel || undefined,
          warranty: warranty || undefined,
          leadTimeDays: deliveryTime ? parseInt(deliveryTime, 10) : undefined,
          stockStatus: stockStatus || undefined,
        },
        {
          images: images.length ? images : undefined,
          catalogue: catalogue ?? undefined,
        },
      );
      await refetchInbox();
      setFormMessage(result.message || "Offer sent successfully.");
      setToastMessage(result.message || "Offer sent successfully.");
      handleCloseSlider();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to send offer. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authData,
    selectedQuote,
    price,
    availableModel,
    warranty,
    deliveryTime,
    stockStatus,
    images,
    catalogue,
    refetchInbox,
    handleCloseSlider,
  ]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const quotes = distributorQuotes || [];

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const rfq = q.rfq as Rfq;
      if (itemScope === "bulk" && !rfq?.isBulk) return false;
      if (itemScope === "standard" && rfq?.isBulk) return false;
      if (productNameFilter) {
        const name = rfq?.items?.[0]?.productName || "";
        if (!name.toLowerCase().includes(productNameFilter.toLowerCase())) return false;
      }
      if (dateFrom && new Date(q.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(q.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [quotes, productNameFilter, dateFrom, dateTo, itemScope]);

  const totalItemsRequested = useMemo(() => {
    return filteredQuotes.reduce((sum, q) => {
      const rfq = q.rfq as Rfq;
      const items = rfq?.items || [];
      return (
        sum +
        items.reduce((line, it) => line + (Number(it.quantity) > 0 ? Number(it.quantity) : 0), 0)
      );
    }, 0);
  }, [filteredQuotes]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedQuotes = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredQuotes.slice(start, start + PAGE_SIZE);
  }, [filteredQuotes, safePage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const getBuyerName = (q: Quote) => {
    const rfq = q.rfq as Rfq;
    const buyer = rfq?.buyer;
    if (typeof buyer === "object" && buyer !== null) {
      return (
        `${(buyer as UserRef).firstName || ""} ${(buyer as UserRef).lastName || ""}`.trim() ||
        "Buyer"
      );
    }
    return "Buyer";
  };

  const getBuyerRegion = (q: Quote) => {
    const rfq = q.rfq as Rfq;
    const loc = rfq?.deliveryLocation?.trim();
    if (loc) return loc;
    const buyer = rfq?.buyer;
    if (typeof buyer === "object" && buyer !== null) {
      const addr = (buyer as UserRef & { address?: string }).address?.trim();
      if (addr) return addr;
    }
    return "—";
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} - ${timePart}`;
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "pending_response":
        return "text-[#6B7280]";
      case "quoted":
        return "text-[#13A83B]";
      case "unavailable":
        return "text-[#E33C13]";
      case "selected_for_order":
        return "text-primary";
      default:
        return "text-[#6B7280]";
    }
  };

  // ── Slider title ─────────────────────────────────────────────────────────
  const sliderTitle: string | React.ReactNode =
    sliderView === "detail" ? (
      "Offer Details"
    ) : (
      <div className="flex items-center gap-3 text-left">
        <button
          type="button"
          onClick={() => setSliderView("detail")}
          className="text-gray1 hover:text-primary transition-colors p-0.5 -ml-0.5"
          aria-label="Back to offer details"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-xl font-semibold text-gray1">Send Offer</span>
      </div>
    );

  // ── Slider: Offer Details view ────────────────────────────────────────────
  const renderDetailView = () => {
    if (!selectedQuote) return null;
    const rfq = selectedQuote.rfq as Rfq;
    const buyer = rfq?.buyer as UserRef | undefined;
    const item = rfq?.items?.[0];
    const product =
      typeof item?.product === "object" ? (item.product as ProductRef) : undefined;
    const buyerName = buyer
      ? `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim()
      : undefined;

    return (
      <div className="space-y-6">
        <DetailField label="Buyer name" value={buyerName} />
        <DetailField label="Product name" value={item?.productName} />
        <DetailField label="Category" value={product?.category} />
        <DetailField label="Model" value={item?.model} />
        <DetailField
          label="Quantity"
          value={item?.quantity != null ? String(item.quantity) : undefined}
        />
        <DetailField label="Description" value={item?.description} />
        <DetailField label="Delivery location" value={rfq?.deliveryLocation} />

        {rfq?.attachments && rfq.attachments.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray2">Attachment</span>
            {rfq.attachments.map((att) => (
              <a
                key={att.cloudinary_id}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="rounded-[14px] bg-[#DEFFE7] p-3 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-[#13A83B]" />
                </div>
                <span className="text-sm text-gray1 underline flex-1 min-w-0 truncate">
                  {att.originalName || "Attachment.pdf"}
                </span>
                <Download size={14} className="text-gray3 shrink-0" />
              </a>
            ))}
          </div>
        )}

        {selectedQuote.status === "pending_response" && (
          <div className="flex flex-col gap-5 pt-2">
            <Button
              title="Send Offer To Buyer"
              variant="primary"
              size="md"
              onClick={() => setSliderView("form")}
              className="w-full"
            />
            <Button
              title={isMarkingUnavailable ? "Marking..." : "Not Available"}
              variant="primaryLight"
              size="md"
              isBusy={isMarkingUnavailable}
              onClick={handleMarkUnavailable}
              disabled={isMarkingUnavailable}
              className="w-full"
            />
            {formError && <p className="text-sm text-danger text-center">{formError}</p>}
          </div>
        )}

        {selectedQuote.status !== "pending_response" && (
          <div className="rounded-xl border border-gray5 p-4 space-y-1">
            <p className="text-sm text-gray3">
              Status:{" "}
              <span className="font-medium text-gray1">
                {QUOTE_STATUS_LABELS[selectedQuote.status] || selectedQuote.status}
              </span>
            </p>
            {selectedQuote.pricePerUnit != null && (
              <p className="text-sm text-gray3">
                Price per unit:{" "}
                <span className="font-medium text-gray1">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    minimumFractionDigits: 0,
                  }).format(selectedQuote.pricePerUnit)}
                </span>
              </p>
            )}
            {selectedQuote.availableModel && (
              <p className="text-sm text-gray3">
                Model:{" "}
                <span className="font-medium text-gray1">{selectedQuote.availableModel}</span>
              </p>
            )}
            {selectedQuote.warranty && (
              <p className="text-sm text-gray3">
                Warranty:{" "}
                <span className="font-medium text-gray1">{selectedQuote.warranty}</span>
              </p>
            )}
            {selectedQuote.stockStatus && (
              <p className="text-sm text-gray3">
                Stock:{" "}
                <span className="font-medium text-gray1">
                  {STOCK_STATUS_OPTIONS.find((o) => o.value === selectedQuote.stockStatus)
                    ?.label ?? selectedQuote.stockStatus}
                </span>
              </p>
            )}
            {selectedQuote.images && selectedQuote.images.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {selectedQuote.images.map((img) => (
                  <a
                    key={img.cloudinary_id}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    {img.originalName || "Image"}
                  </a>
                ))}
              </div>
            )}
            {selectedQuote.catalogue && (
              <a
                href={selectedQuote.catalogue.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary underline pt-1"
              >
                <FileText size={12} />
                {selectedQuote.catalogue.originalName || "Catalogue.pdf"}
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFormView = () => (
    <div className="space-y-6">
      <Input
        id="quotePrice"
        label="Price"
        type="number"
        placeholder="Enter price"
        value={price}
        onValueChange={setPrice}
      />
      <Input
        id="quoteAvailableModel"
        label="Available model"
        placeholder="Enter model"
        value={availableModel}
        onValueChange={setAvailableModel}
      />
      <Input
        id="quoteWarranty"
        label="Warranty"
        placeholder="Enter warranty"
        value={warranty}
        onValueChange={setWarranty}
      />
      <Input
        id="quoteDeliveryTime"
        label="Delivery time"
        type="number"
        placeholder="Enter delivery time (days)"
        value={deliveryTime}
        onValueChange={setDeliveryTime}
      />
      <Select
        label="Stock status"
        placeholder="Select option"
        options={STOCK_STATUS_OPTIONS}
        value={stockStatus}
        onValueChange={setStockStatus}
      />

      <div className="flex flex-col gap-2">
        <FileUpload
          id="quoteImages"
          label="Upload pictures"
          multiple
          accept="image/png,image/jpg,image/jpeg"
          onChange={(e) => {
            if (e.target.files) setImages(Array.from(e.target.files));
          }}
        />
        {images.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {images.map((f, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-1 truncate max-w-[160px]"
              >
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FileUpload
          id="quoteCatalogue"
          label="Upload PDF catalogue (Optional)"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setCatalogue(file);
          }}
        />
        {catalogue && (
          <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-1 inline-block mt-1 truncate max-w-xs">
            {catalogue.name}
          </span>
        )}
      </div>

      <Button
        title={isSubmitting ? "Sending..." : "Send Offer"}
        variant="primary"
        size="md"
        isBusy={isSubmitting}
        onClick={(event) => {
          event.preventDefault();
          void handleSendOffer();
        }}
        disabled={isSubmitting || !price}
        className="w-full"
      />
      {formError && <p className="text-sm text-danger text-center">{formError}</p>}
      {formMessage && <p className="text-sm text-success text-center">{formMessage}</p>}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Quote Request"
        description="View all quote request from customers"
      />
      <div className="p-4 md:p-6 bg-gray7 space-y-4 w-full">
        {/* Summary: total items + View Bulk Source (Figma) */}
        <div className="card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-6 md:p-8 rounded-2xl border border-gray5 bg-white">
          <div className="space-y-0.5">
            <p className="text-[40px] font-semibold leading-[48px] text-gray1 tabular-nums">
              {totalItemsRequested}
            </p>
            <p className="text-base text-gray1 leading-7">Total Item requested</p>
          </div>
          <Button
            title="View Bulk Source"
            variant="primary"
            size="lg"
            onClick={() => setBulkSourceOpen(true)}
            className="w-full sm:w-[250px] h-[60px] rounded-xl shrink-0 !text-base font-normal"
          />
        </div>

        {/* Filters + Table */}
        <div className="card p-4 md:p-6 rounded-2xl border border-gray5 bg-white overflow-hidden">
          <div className="mb-6">
            <h3 className="font-medium text-xl text-gray1 mb-1">All Request</h3>
            <p className="text-sm text-gray3 leading-5">
              Total list of all requested quotes for equipment and consumables
            </p>
          </div>

          <div className="mb-6">
            <p className="text-base text-gray1 mb-4">Filter table list by:</p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              {/* Product name */}
              <div className="flex-1 min-w-[180px]">
                <Input
                  id="productNameFilter"
                  label="Product name"
                  placeholder="Enter product name"
                  value={productNameFilter}
                  onValueChange={setProductNameFilter}
                />
              </div>

              {/* Date range */}
              <div className="flex-1 min-w-[180px]">
                <label htmlFor="dateFilterTrigger" className="block text-gray1 pl-1 mb-2 text-sm">
                  Date
                </label>
                <Popover.Root open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <Popover.Trigger asChild>
                    <div className="relative w-full cursor-pointer">
                      <input
                        id="dateFilterTrigger"
                        type="text"
                        placeholder="From - To"
                        value={
                          dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : dateFrom || ""
                        }
                        readOnly
                        className="block w-full rounded-xl border border-gray5 px-4 py-3 pr-10 text-gray1 placeholder-gray4 focus:outline-none focus:border-gray2 text-base h-[60px] cursor-pointer"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-gray4 pointer-events-none" />
                    </div>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-white rounded-lg border shadow-lg p-4 z-50 min-w-[300px]"
                      sideOffset={5}
                    >
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="filterDateFrom" className="block text-sm font-medium mb-2">From</label>
                          <input
                            id="filterDateFrom"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="block w-full rounded-xl border border-gray5 px-4 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="filterDateTo" className="block text-sm font-medium mb-2">To</label>
                          <input
                            id="filterDateTo"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            min={dateFrom}
                            className="block w-full rounded-xl border border-gray5 px-4 py-2 text-sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            title="Clear"
                            variant="secondaryLight"
                            size="sm"
                            onClick={() => { setDateFrom(""); setDateTo(""); }}
                            className="w-fit"
                          />
                          <Button
                            title="Apply"
                            variant="primary"
                            size="sm"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="w-fit"
                          />
                        </div>
                      </div>
                      <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              {/* Filter button */}
              <Button
                title="Filter"
                variant="primaryLight"
                size="lg"
                iconLeft={<SlidersHorizontal className="size-4" />}
                onClick={handleApplyFilters}
                className="h-[60px] w-full lg:w-[130px] rounded-xl shrink-0 !text-base font-normal border border-[#B3E5FC] bg-[#EAF9FF] text-[#017BED] hover:bg-[#ddf1fc]"
              />

              {/* All Items scope selector */}
              <div className="shrink-0 w-full lg:w-[160px]">
                <ItemScopeSelect
                  value={itemScope}
                  onValueChange={(v) => setItemScope(v as ItemScope)}
                >
                  <SelectTrigger
                    size="lg"
                    className="h-[60px] rounded-xl border-gray5 bg-white text-gray2 gap-2"
                  >
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="bulk">Bulk only</SelectItem>
                    <SelectItem value="standard">Single line</SelectItem>
                  </SelectContent>
                </ItemScopeSelect>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="No quote requests"
              description="When buyers request a quote, it will be displayed here"
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="text-[#6B7280] border-gray6 hover:bg-transparent">
                      <TableHead className="font-medium text-base">Buyers Name</TableHead>
                      <TableHead className="font-medium text-base">Buyer region</TableHead>
                      <TableHead className="font-medium text-base">Status</TableHead>
                      <TableHead className="font-medium text-base">Date of request</TableHead>
                      <TableHead className="font-medium text-base text-right pr-2">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQuotes.map((q) => (
                      <TableRow key={q._id} className="border-gray6">
                        <TableCell className="text-base text-gray1 py-4">
                          {getBuyerName(q)}
                        </TableCell>
                        <TableCell className="text-base text-gray1 py-4">
                          {getBuyerRegion(q)}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`text-base font-normal ${statusClass(q.status)}`}>
                            {QUOTE_STATUS_LABELS[q.status] || q.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-base text-gray1 py-4 whitespace-nowrap">
                          {formatDateTime(q.createdAt)}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuote(q);
                              setIsDetailOpen(true);
                              setSliderView("detail");
                            }}
                            className="text-primary inline-flex items-center justify-center gap-2 cursor-pointer text-base font-normal hover:underline"
                          >
                            <Eye className="size-6 shrink-0 text-primary" />
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-4 border-t border-gray6">
                <div className="flex items-center gap-3 text-base text-gray1">
                  <span>Page</span>
                  <span className="inline-flex min-w-[45px] h-11 items-center justify-center rounded-xl border border-gray5 px-4 tabular-nums">
                    {safePage}
                  </span>
                  <span>of {totalPages}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray5 bg-gray7 text-gray1 disabled:opacity-40 disabled:pointer-events-none hover:bg-gray6"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40 disabled:pointer-events-none hover:bg-primary-dark"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <RightSlider open={isDetailOpen} onClose={handleCloseSlider} title={sliderTitle}>
        {selectedQuote &&
          (sliderView === "detail" ? renderDetailView() : renderFormView())}
      </RightSlider>

      <RightSlider
        open={bulkSourceOpen}
        onClose={() => setBulkSourceOpen(false)}
        title="Bulk source batches"
      >
        <BulkRfqSourcePanel />
      </RightSlider>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-gray5 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm text-success">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function DistributorQuotesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray3 text-sm">Loading…</div>}>
      <DistributorQuotesPageInner />
    </Suspense>
  );
}
