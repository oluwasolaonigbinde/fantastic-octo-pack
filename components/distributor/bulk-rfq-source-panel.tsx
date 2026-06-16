"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Eye, Layers } from "lucide-react";
import {
  Button,
  EmptyState,
  Input,
  FileUpload,
  Select,
  Skeleton,
  RightSlider,
} from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import { QUOTE_STATUS_LABELS } from "@/types/rfq";
import type {
  BulkRfqBatchListItem,
  BulkBatchDetailResponse,
  BulkBatchDetailItem,
  UserRef,
} from "@/types/rfq";
import rfqService from "@/services/rfqService";

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

const STOCK_STATUS_OPTIONS = [
  { label: "In Stock", value: "in_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
  { label: "Limited Stock", value: "limited" },
  { label: "On Order", value: "on_order" },
];

export function BulkRfqSourcePanel() {
  const { data: authData } = useAppSelector((state) => state.auth);

  const [batches, setBatches] = useState<BulkRfqBatchListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<BulkBatchDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [actionItem, setActionItem] = useState<BulkBatchDetailItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<"detail" | "form">("detail");

  const [price, setPrice] = useState("");
  const [availableModel, setAvailableModel] = useState("");
  const [warranty, setWarranty] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [catalogue, setCatalogue] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingUnavailable, setIsMarkingUnavailable] = useState(false);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getBuyerName = (buyer: string | UserRef): string => {
    if (typeof buyer === "object" && buyer !== null) {
      return `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || "Buyer";
    }
    return "Buyer";
  };

  const resetForm = useCallback(() => {
    setPrice("");
    setAvailableModel("");
    setWarranty("");
    setDeliveryTime("");
    setStockStatus("");
    setImages([]);
    setCatalogue(null);
  }, []);

  const loadBatches = useCallback(async () => {
    if (!authData?.tokens?.accessToken) return;
    setIsLoading(true);
    try {
      const result = await rfqService.fetchDistributorBulkBatches(authData.tokens.accessToken);
      setBatches(result.data || []);
    } catch {
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [authData]);

  const loadBatchDetail = useCallback(
    async (batchId: string) => {
      if (!authData?.tokens?.accessToken) return;
      setIsDetailLoading(true);
      setSelectedBatch(null);
      try {
        const result = await rfqService.fetchBulkBatchDetail(
          authData.tokens.accessToken,
          batchId
        );
        setSelectedBatch(result.data);
      } catch {
        // silent
      } finally {
        setIsDetailLoading(false);
      }
    },
    [authData]
  );

  useEffect(() => {
    if (authData?.tokens?.accessToken && batches === null) {
      loadBatches();
    }
  }, [authData?.tokens?.accessToken, batches, loadBatches]);

  const handleViewBatch = useCallback(
    (batch: BulkRfqBatchListItem) => {
      setShowDetail(true);
      loadBatchDetail(batch._id);
    },
    [loadBatchDetail]
  );

  const handleBackToList = useCallback(() => {
    setShowDetail(false);
    setSelectedBatch(null);
    loadBatches();
  }, [loadBatches]);

  const handleOpenItemAction = useCallback((item: BulkBatchDetailItem) => {
    setActionItem(item);
    setDrawerView("detail");
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setActionItem(null);
    setDrawerView("detail");
    resetForm();
  }, [resetForm]);

  const handleMarkUnavailable = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !actionItem?.quote) return;
    setIsMarkingUnavailable(true);
    try {
      await rfqService.respondToQuote(authData.tokens.accessToken, actionItem.quote._id, {
        response: "unavailable",
      });
      handleCloseDrawer();
      if (selectedBatch) {
        loadBatchDetail(selectedBatch.batch._id);
      }
    } catch {
      // silent
    } finally {
      setIsMarkingUnavailable(false);
    }
  }, [authData, actionItem, selectedBatch, handleCloseDrawer, loadBatchDetail]);

  const handleSendOffer = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !actionItem?.quote || !price) return;
    setIsSubmitting(true);
    try {
      await rfqService.respondToQuote(
        authData.tokens.accessToken,
        actionItem.quote._id,
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
        }
      );
      handleCloseDrawer();
      if (selectedBatch) {
        loadBatchDetail(selectedBatch.batch._id);
      }
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authData,
    actionItem,
    price,
    availableModel,
    warranty,
    deliveryTime,
    stockStatus,
    images,
    catalogue,
    selectedBatch,
    handleCloseDrawer,
    loadBatchDetail,
  ]);

  const renderItemDetail = () => {
    if (!actionItem) return null;
    const { rfq, quote } = actionItem;
    const item = rfq.items[0];
    const isPending = quote?.status === "pending_response";

    return (
      <div className="space-y-6 pt-2">
        <div className="space-y-5">
          <DetailField label="Product name" value={item?.productName} />
          <DetailField
            label="Quantity"
            value={item?.quantity != null ? String(item.quantity) : undefined}
          />
          <DetailField label="Delivery location" value={rfq.deliveryLocation} />
          <DetailField label="Additional notes" value={rfq.additionalNotes} />
          <DetailField label="Date received" value={formatDate(rfq.createdAt)} />
          {quote && (
            <DetailField
              label="Status"
              value={QUOTE_STATUS_LABELS[quote.status] || quote.status}
            />
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-3 pt-2">
            <Button
              title="Send a Quote"
              variant="primary"
              size="md"
              onClick={() => setDrawerView("form")}
              className="w-full"
            />
            <Button
              title={isMarkingUnavailable ? "Processing..." : "Not Available"}
              variant="secondaryLight"
              size="md"
              isBusy={isMarkingUnavailable}
              onClick={handleMarkUnavailable}
              disabled={isMarkingUnavailable}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  };

  const renderSendQuoteForm = () => {
    if (!actionItem) return null;
    const item = actionItem.rfq.items[0];

    return (
      <div className="space-y-6 pt-2">
        <button
          type="button"
          onClick={() => setDrawerView("detail")}
          className="flex items-center gap-1 text-sm text-gray3 hover:text-gray1"
        >
          <ArrowLeft size={16} /> Back to details
        </button>

        <p className="text-sm text-gray2">
          Quoting for: <strong>{item?.productName}</strong> (Qty: {item?.quantity})
        </p>

        <Input
          id="bulkPrice"
          label="Price per unit"
          type="number"
          placeholder="Enter price"
          value={price}
          onValueChange={setPrice}
        />

        <Input
          id="bulkModel"
          label="Available model"
          type="text"
          placeholder="e.g. XYZ-1000"
          value={availableModel}
          onValueChange={setAvailableModel}
        />

        <Input
          id="bulkWarranty"
          label="Warranty"
          type="text"
          placeholder="e.g. 1 year"
          value={warranty}
          onValueChange={setWarranty}
        />

        <Input
          id="bulkDeliveryTime"
          label="Delivery time (days)"
          type="number"
          placeholder="e.g. 14"
          value={deliveryTime}
          onValueChange={setDeliveryTime}
        />

        <Select
          label="Stock status"
          placeholder="Select status"
          options={STOCK_STATUS_OPTIONS}
          value={stockStatus}
          onValueChange={setStockStatus}
        />

        <FileUpload
          id="bulkImages"
          label="Upload pictures (optional)"
          multiple
          accept="image/png,image/jpg,image/jpeg"
          onChange={(e) => {
            if (e.target.files) setImages(Array.from(e.target.files));
          }}
        />

        <FileUpload
          id="bulkCatalogue"
          label="Upload PDF catalogue (optional)"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setCatalogue(file);
          }}
        />

        <Button
          title={isSubmitting ? "Sending..." : "Send Quote"}
          variant="primary"
          size="md"
          isBusy={isSubmitting}
          onClick={handleSendOffer}
          disabled={isSubmitting || !price}
          className="w-full"
        />
      </div>
    );
  };

  const renderBatchDetail = () => {
    if (isDetailLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      );
    }

    if (!selectedBatch) return null;

    const { batch, items } = selectedBatch;
    const pending = items.filter((i) => i.quote?.status === "pending_response").length;
    const quoted = items.filter((i) => i.quote?.status === "quoted").length;

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBackToList}
          className="flex items-center gap-1 text-sm text-gray3 hover:text-gray1"
        >
          <ArrowLeft size={16} /> Back to list
        </button>

        <div className="card p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray1">
            {batch.title || "Bulk RFQ Batch"}
          </h2>
          <p className="text-sm text-gray3 mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} &middot; {pending} pending &middot;{" "}
            {quoted} quoted
          </p>
          <p className="text-xs text-gray3 mt-1">
            Buyer: {getBuyerName(batch.buyer)} &middot; {formatDate(batch.createdAt)}
          </p>
        </div>

        <div className="card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-gray3">
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => {
                const lineItem = item.rfq.items[0];
                const status = item.quote?.status || "pending_response";
                const statusColor =
                  status === "quoted"
                    ? "text-success"
                    : status === "unavailable"
                      ? "text-gray3"
                      : "text-warning";

                return (
                  <TableRow key={item.rfq._id}>
                    <TableCell className="text-gray3">{idx + 1}</TableCell>
                    <TableCell>{lineItem?.productName || "—"}</TableCell>
                    <TableCell>{lineItem?.quantity || "—"}</TableCell>
                    <TableCell className="truncate max-w-[120px]">
                      {item.rfq.deliveryLocation || "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${statusColor}`}>
                        {QUOTE_STATUS_LABELS[status] || status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleOpenItemAction(item)}
                        className="text-success inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={16} /> View
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderBatchList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      );
    }

    if (!batches || batches.length === 0) {
      return (
        <EmptyState
          icon={<Layers />}
          title="No bulk RFQ batches"
          description="Bulk RFQ batches from buyers will appear here"
        />
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="text-gray3">
            <TableHead>Title</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Quoted</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch._id}>
              <TableCell>{batch.title || "Untitled Batch"}</TableCell>
              <TableCell>{getBuyerName(batch.buyer)}</TableCell>
              <TableCell>{batch.quoteCount}</TableCell>
              <TableCell>
                {batch.pendingCount > 0 ? (
                  <span className="text-warning font-medium">{batch.pendingCount}</span>
                ) : (
                  <span className="text-gray3">0</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-success font-medium">{batch.quotedCount}</span>
              </TableCell>
              <TableCell>{formatDate(batch.createdAt)}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => handleViewBatch(batch)}
                  className="text-success inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={16} /> View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {!showDetail && (
          <div className="card p-4 md:p-6">
            <p className="text-sm text-gray2">Total bulk batches</p>
            <p className="text-3xl font-bold text-gray1">{batches?.length || 0}</p>
          </div>
        )}

        <div className="card p-4">{showDetail ? renderBatchDetail() : renderBatchList()}</div>
      </div>

      <RightSlider
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={drawerView === "form" ? "Send a Quote" : "Item Details"}
      >
        {drawerView === "detail" && renderItemDetail()}
        {drawerView === "form" && renderSendQuoteForm()}
      </RightSlider>
    </>
  );
}
