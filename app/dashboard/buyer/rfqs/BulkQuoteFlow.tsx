"use client";

/**
 * Buyer bulk-RFQ flow, in two steps that mirror the Figma:
 *
 *  1. "Request Bulk Quote" — download the Excel template, fill it offline, and
 *     upload it. Parsing (see utils/rfqTemplate) resolves the category /
 *     sub-category names the buyer picked into the ObjectIds the API needs.
 *  2. "Review quote (From Excel)" — an editable table of the parsed rows. Rows
 *     that are missing a required field or named an unknown category are flagged
 *     "Need attention" and can be fixed inline (dropdowns / inputs) or deleted.
 *     Only ready rows are sent.
 *
 * All rows are submitted together as one RFQ via POST /rfqs (isBulk), then that
 * RFQ is submitted so the routing engine fans it out — the same contract the
 * single-quote flow uses, just with many line items. Delivery address and
 * timeline are shared across the batch, which is all the template + API carry.
 */

import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileText, Trash2, X } from "lucide-react";

import { Button } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useCreateRfqMutation } from "@/hooks/queries/rfqs";
import rfqService from "@/services/rfqService";
import type { Category } from "@/types/categories";
import type { UserAddress } from "@/types/address";
import type { CreateRfqItem } from "@/types/rfq";
import { parseRfqTemplate } from "@/utils/rfqTemplate";

const PAGE_SIZE = 6;

const addressLabel = (address: UserAddress) =>
  [address.address, address.city, address.state].filter(Boolean).join(", ");

const isReady = (item: CreateRfqItem) =>
  Boolean(item.productName.trim()) && Boolean(item.category) && item.quantity >= 1;

interface BulkQuoteFlowProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  addresses: UserAddress[];
  onSubmitted: () => void;
}

export default function BulkQuoteFlow({
  open,
  onClose,
  categories,
  addresses,
  onSubmitted,
}: BulkQuoteFlowProps) {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const createRfq = useCreateRfqMutation();

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<CreateRfqItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [addressId, setAddressId] = useState(
    () => addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || "",
  );
  const [deliveryTimeline, setDeliveryTimeline] = useState("");

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c._id, c.name])),
    [categories],
  );
  const subName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => c.subcategories.forEach((s) => map.set(s._id, s.name)));
    return map;
  }, [categories]);

  const readyCount = items.filter(isReady).length;
  const attentionCount = items.length - readyCount;
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(pageStart, pageStart + PAGE_SIZE);

  if (!open) return null;

  const reset = () => {
    setStep("upload");
    setFileName("");
    setItems([]);
    setError(null);
    setPage(1);
    setPendingDelete(null);
    setDeliveryTimeline("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleDownload = async () => {
    if (!token) return;
    setError(null);
    setIsDownloading(true);
    try {
      await rfqService.downloadRfqTemplate(token);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download the template.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsParsing(true);
    setError(null);
    try {
      const { items: parsed, fileError } = await parseRfqTemplate(file);
      if (fileError) {
        setError(fileError);
        return;
      }
      if (parsed.length === 0) {
        setError("That template has no filled-in rows. Add at least one item and re-upload.");
        return;
      }
      setFileName(file.name);
      setItems(parsed);
    } catch {
      setError("Could not read that file. Please upload the .xlsx template downloaded from Baiy.");
    } finally {
      setIsParsing(false);
    }
  };

  const updateItem = (indexOnPage: number, update: Partial<CreateRfqItem>) => {
    const absolute = pageStart + indexOnPage;
    setItems((current) =>
      current.map((item, index) => (index === absolute ? { ...item, ...update } : item)),
    );
  };

  const confirmDelete = () => {
    if (pendingDelete === null) return;
    const absolute = pageStart + pendingDelete;
    setItems((current) => current.filter((_, index) => index !== absolute));
    setPendingDelete(null);
  };

  const downloadReviewedExcel = () => {
    const rows = items.filter(isReady).map((item) => ({
      "Product Name": item.productName,
      Quantity: item.quantity,
      Category: categoryName.get(item.category) || "",
      "Sub-Category": item.subCategory ? subName.get(item.subCategory) || "" : "",
      Brand: item.brand || "",
      Model: item.model || "",
      Description: item.description || "",
      Notes: item.notes || "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "RFQ Items");
    XLSX.writeFile(workbook, "baiy-rfq-reviewed.xlsx");
  };

  const submit = async () => {
    if (!token) return;
    const ready = items.filter(isReady);
    if (ready.length === 0) {
      setError("Add at least one ready item before sending.");
      return;
    }
    if (!addressId) {
      setError("Select a delivery address before sending.");
      return;
    }
    setError(null);
    const requestItems = ready.map((item) => ({
      productName: item.productName.trim(),
      quantity: item.quantity,
      category: item.category,
      ...(item.subCategory ? { subCategory: item.subCategory } : {}),
      ...(item.brand?.trim() ? { brand: item.brand.trim() } : {}),
      ...(item.model?.trim() ? { model: item.model.trim() } : {}),
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
      ...(item.notes?.trim() ? { notes: item.notes.trim() } : {}),
    }));
    try {
      const created = await createRfq.mutateAsync({
        data: {
          items: requestItems,
          addressId,
          deliveryTimeline: deliveryTimeline || undefined,
          isBulk: true,
        },
      });
      await rfqService.submitRfq(token, created.data._id);
      close();
      onSubmitted();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send the bulk request. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray1/40 p-0 md:items-center md:justify-center md:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={step === "upload" ? "Request bulk quote" : "Review bulk quote"}
        className={`flex h-full w-full flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[90vh] md:rounded-2xl ${step === "review" ? "max-w-4xl" : "max-w-md"}`}
      >
        {step === "upload" ? (
          <>
            <header className="flex items-center justify-between border-b border-gray5 px-5 py-5">
              <h2 className="text-xl font-semibold text-gray1">Request Bulk Quote</h2>
              <button type="button" aria-label="Close" onClick={close} className="rounded p-2 text-gray2 hover:bg-gray7">
                <X size={22} />
              </button>
            </header>
            <div className="space-y-6 p-5 md:p-6">
              <p className="text-sm leading-6 text-gray2">
                Kindly <span className="font-medium text-success">DOWNLOAD</span> this template and fill all required
                information, then upload below to submit your request.
              </p>
              <Button
                title={isDownloading ? "Preparing..." : "Download Template"}
                variant="secondaryLight"
                size="md"
                iconLeft={<Download size={18} />}
                isBusy={isDownloading}
                onClick={() => void handleDownload()}
                className="!w-auto"
              />
              <div>
                <p className="text-sm font-medium text-gray1">Upload template</p>
                <label
                  htmlFor="bulk-template-upload"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray5 bg-white px-4 py-10 text-center transition-colors hover:bg-gray7"
                >
                  <FileText size={30} className="text-gray3" />
                  <span className="text-sm text-gray3">
                    <span className="font-medium text-primary">
                      {isParsing ? "Reading file..." : "Click here"}
                    </span>{" "}
                    to upload file
                  </span>
                  <span className="text-xs text-gray3">Allowed format: .xlsx (the template above)</span>
                  <input
                    id="bulk-template-upload"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={(event) => void handleUpload(event)}
                  />
                </label>
                {fileName ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray1">
                    <FileText size={14} /> {fileName} — {items.length} row{items.length === 1 ? "" : "s"} parsed
                  </p>
                ) : null}
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </div>
            <footer className="mt-auto border-t border-gray5 p-5">
              <Button
                title="Request Quote"
                variant="primary"
                size="md"
                disabled={items.length === 0}
                onClick={() => {
                  setError(null);
                  setStep("review");
                  setPage(1);
                }}
                className="w-full"
              />
            </footer>
          </>
        ) : (
          <>
            <header className="flex items-start justify-between border-b border-gray5 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray1">Review quote (From Excel)</h2>
                <p className="mt-0.5 text-sm text-gray3">Please review parsed items before sending to suppliers.</p>
              </div>
              <button type="button" aria-label="Close" onClick={close} className="rounded p-2 text-gray2 hover:bg-gray7">
                <X size={22} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="rounded-xl border border-gray5 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray1">Items Summary</p>
                  <Button
                    title="Download reviewed Excel"
                    variant="secondaryLight"
                    size="sm"
                    iconLeft={<Download size={15} />}
                    onClick={downloadReviewedExcel}
                    className="!w-auto"
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-gray3">
                    Items parsed
                    <p className="mt-1 font-medium text-gray1">{items.length}</p>
                  </label>
                  <label className="block text-sm text-gray3">
                    Delivery address
                    <select
                      value={addressId}
                      onChange={(event) => setAddressId(event.target.value)}
                      className="mt-1 h-11 w-full rounded-lg border border-gray5 bg-white px-3 text-sm text-gray1"
                    >
                      <option value="">Select saved address</option>
                      {addresses.map((address) => (
                        <option key={address._id} value={address._id}>
                          {addressLabel(address)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-gray3 sm:col-span-2">
                    Delivery timeline (optional)
                    <input
                      value={deliveryTimeline}
                      onChange={(event) => setDeliveryTimeline(event.target.value)}
                      placeholder="e.g. Within 2 weeks"
                      className="mt-1 h-11 w-full rounded-lg border border-gray5 bg-white px-3 text-sm text-gray1"
                    />
                  </label>
                </div>
                {addresses.length === 0 ? (
                  <p className="mt-2 text-sm text-warning">Add a saved delivery address before sending.</p>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray1">Parsed items ({items.length})</p>
                <div className="overflow-x-auto rounded-xl border border-gray5">
                  <table className="min-w-[880px] w-full text-left text-sm">
                    <thead className="border-b border-gray5 bg-gray7 text-xs text-gray3">
                      <tr>
                        <th className="px-3 py-3 font-medium">#</th>
                        <th className="px-3 py-3 font-medium">Product</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Sub Category</th>
                        <th className="px-3 py-3 font-medium">Model</th>
                        <th className="px-3 py-3 font-medium">Qty</th>
                        <th className="px-3 py-3 font-medium">Specification</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, indexOnPage) => {
                        const category = categories.find((c) => c._id === item.category);
                        const ready = isReady(item);
                        return (
                          <tr key={pageStart + indexOnPage} className="border-b border-gray6 align-top last:border-0">
                            <td className="px-3 py-3 text-gray3">{pageStart + indexOnPage + 1}</td>
                            <td className="px-3 py-3">
                              <input
                                value={item.productName}
                                onChange={(event) => updateItem(indexOnPage, { productName: event.target.value })}
                                placeholder="Product name"
                                className={`h-9 w-40 rounded border px-2 ${item.productName.trim() ? "border-gray5" : "border-warning bg-warning/5"}`}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={item.category}
                                onChange={(event) => updateItem(indexOnPage, { category: event.target.value, subCategory: "" })}
                                className={`h-9 w-36 rounded border px-2 ${item.category ? "border-gray5" : "border-warning bg-warning/5"}`}
                              >
                                <option value="">Select</option>
                                {categories.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={item.subCategory || ""}
                                onChange={(event) => updateItem(indexOnPage, { subCategory: event.target.value })}
                                disabled={!category}
                                className="h-9 w-36 rounded border border-gray5 px-2 disabled:bg-gray7"
                              >
                                <option value="">Optional</option>
                                {category?.subcategories.map((s) => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={item.model || ""}
                                onChange={(event) => updateItem(indexOnPage, { model: event.target.value })}
                                placeholder="-"
                                className="h-9 w-28 rounded border border-gray5 px-2"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity || ""}
                                onChange={(event) => updateItem(indexOnPage, { quantity: Math.max(0, Number(event.target.value) || 0) })}
                                className={`h-9 w-16 rounded border px-2 ${item.quantity >= 1 ? "border-gray5" : "border-warning bg-warning/5"}`}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={item.description || ""}
                                onChange={(event) => updateItem(indexOnPage, { description: event.target.value })}
                                placeholder="Optional"
                                className="h-9 w-44 rounded border border-gray5 px-2"
                              />
                            </td>
                            <td className="px-3 py-3">
                              {ready ? (
                                <span className="whitespace-nowrap font-medium text-success">✓ Ready</span>
                              ) : (
                                <span className="whitespace-nowrap font-medium text-warning">⚠ Need attention</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                aria-label="Delete item"
                                onClick={() => setPendingDelete(indexOnPage)}
                                className="rounded p-1.5 text-danger hover:bg-danger/10"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pageCount > 1 ? (
                  <div className="mt-3 flex items-center justify-between text-sm text-gray3">
                    <span>
                      {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, items.length)} of {items.length}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`h-8 w-8 rounded border ${pageNumber === currentPage ? "border-primary bg-primary text-white" : "border-gray5 text-gray1"}`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </div>

            <footer className="flex flex-col gap-3 border-t border-gray5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray1">
                {readyCount} item{readyCount === 1 ? "" : "s"} ready
                {attentionCount > 0 ? (
                  <span className="text-warning">
                    {" "}({attentionCount} need{attentionCount === 1 ? "s" : ""} attention, won&apos;t be sent)
                  </span>
                ) : null}
              </p>
              <div className="flex gap-3">
                <Button title="Cancel" variant="secondaryLight" size="md" onClick={close} className="!w-auto" />
                <Button
                  title={createRfq.isPending ? "Sending..." : "Send Bulk RFQ"}
                  variant="primary"
                  size="md"
                  isBusy={createRfq.isPending}
                  disabled={readyCount === 0 || !addressId}
                  onClick={() => void submit()}
                  className="!w-auto"
                />
              </div>
            </footer>
          </>
        )}
      </section>

      {pendingDelete !== null ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-gray1/40 p-4">
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 text-center shadow-xl">
            <Trash2 className="mx-auto size-8 text-danger" />
            <h3 className="mt-3 text-lg font-semibold text-danger">Delete?</h3>
            <p className="mt-2 text-sm text-gray2">Are you sure you want to delete this item?</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button title="Cancel" variant="primary" size="sm" onClick={() => setPendingDelete(null)} className="!w-auto" />
              <Button title="Delete Item" variant="secondaryLight" size="sm" onClick={confirmDelete} className="!w-auto" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
