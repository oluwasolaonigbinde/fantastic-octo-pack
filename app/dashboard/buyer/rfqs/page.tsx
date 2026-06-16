"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  Upload,
} from "lucide-react";
import Header from "../../component/header";
import {
  Button,
  EmptyState,
  Skeleton,
  Input,
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
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchBuyerRfqs } from "@/store/slices/rfq-slice";
import type { Rfq, Quote, UserRef, RfqDetailResponse, BulkRfqItemPayload } from "@/types/rfq";
import { QUOTE_STATUS_LABELS } from "@/types/rfq";
import rfqService from "@/services/rfqService";
import { userService } from "@/services/userService";
import productService from "@/services/productService";
import type { PublicProfileData } from "@/types/user";
import { UserRole } from "@/types/user";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "sourcing_offer" | "sourcing_offers_received";
type DrawerMode = "none" | "create" | "bulk_create" | "sent_detail" | "quote_detail";
const BULK_CSV_HEADERS = [
  "product_name",
  "quantity",
  "distributor_email",
  "proposed_delivery_date",
  "delivery_location",
  "additional_note",
];

// ─── Sub-component ────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray2">{label}</span>
      <span className="text-sm text-gray1">{value}</span>
    </div>
  );
}

function getDistributorDisplayName(
  distributor?:
    | Pick<
        PublicProfileData,
        "_id" | "firstName" | "lastName" | "distributorStoreProfile"
      >
    | UserRef
    | null,
): string {
  if (!distributor) return "";

  const businessName = distributor.distributorStoreProfile?.businessName?.trim();
  if (businessName) return businessName;

  return [distributor.firstName, distributor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerRfqsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rfqs, isLoading } = useAppSelector((state) => state.rfq);
  const { data: authData } = useAppSelector((state) => state.auth);

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("sourcing_offer");

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("none");

  // ── Detail state ──────────────────────────────────────────────────────────
  const [selectedRfqDetail, setSelectedRfqDetail] = useState<RfqDetailResponse | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // ── Quotes received (lazy-loaded) ─────────────────────────────────────────
  const [allQuotes, setAllQuotes] = useState<Quote[] | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Create form ───────────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({
    productName: "",
    productId: "",
    distributorId: "",
    distributorName: "",
    quantity: 1,
    deliveryDate: "",
    deliveryLocation: "",
    additionalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Action states ─────────────────────────────────────────────────────────
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // ── Bulk RFQ state ─────────────────────────────────────────────────────────
  const [bulkItems, setBulkItems] = useState<BulkRfqItemPayload[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; message: string }[]>([]);
  const [bulkTitle, setBulkTitle] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);

  const [sentOffersFilter, setSentOffersFilter] = useState<string>("all");

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Array<{ _id: string; name: string }>>([]);
  const [distributors, setDistributors] = useState<PublicProfileData[]>([]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const acceptedQuoteByRfqId = useMemo(() => {
    const map = new Map<string, Quote>();
    (allQuotes ?? []).forEach((q) => {
      if (q.status === "selected_for_order") {
        const rfqId = typeof q.rfq === "object" ? q.rfq._id : q.rfq;
        map.set(rfqId, q);
      }
    });
    return map;
  }, [allQuotes]);

  const distributorNameById = useMemo(() => {
    const names = new Map<string, string>();

    distributors.forEach((distributor) => {
      const displayName = getDistributorDisplayName(distributor);

      if (displayName) {
        names.set(distributor._id, displayName);
      }
    });

    if (createForm.distributorId && createForm.distributorName) {
      names.set(createForm.distributorId, createForm.distributorName);
    }

    return names;
  }, [createForm.distributorId, createForm.distributorName, distributors]);

  const getDistributorName = (val: string | UserRef): string => {
    if (typeof val === "object" && val !== null) {
      return getDistributorDisplayName(val) || val.email || "Unknown distributor";
    }
    return distributorNameById.get(val) ?? "Unknown distributor";
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (val?: number) =>
    val != null
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 0,
        }).format(val)
      : "—";

  const rfqStatusColor = (status: string) => {
    if (status === "converted_to_order") return "text-success";
    if (status === "closed") return "text-gray3";
    return "text-warning";
  };

  const sentOfferStatusLabel = (status: string) => {
    if (status === "converted_to_order") return "Completed";
    if (status === "closed") return "Closed";
    return "Pending";
  };

  const quoteStatusColor = (status: string) => {
    if (status === "selected_for_order") return "text-success";
    if (status === "rejected_by_buyer" || status === "not_selected") return "text-gray3";
    if (status === "quoted") return "text-primary";
    return "text-warning";
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  const loadAllQuotes = useCallback(async () => {
    if (!authData?.tokens?.accessToken) return;
    setQuotesLoading(true);
    try {
      const result = await rfqService.fetchBuyerReceivedQuotes(
        authData.tokens.accessToken
      );
      setAllQuotes(result.data || []);
    } catch {
      setAllQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  }, [authData]);

  useEffect(() => {
    if (authData?.tokens?.accessToken && !rfqs) {
      dispatch(fetchBuyerRfqs(authData.tokens.accessToken));
    }

    let quoteLoadTimer: number | null = null;
    if (authData?.tokens?.accessToken && allQuotes === null && !quotesLoading) {
      quoteLoadTimer = window.setTimeout(() => void loadAllQuotes(), 0);
    }

    return () => {
      if (quoteLoadTimer !== null) {
        window.clearTimeout(quoteLoadTimer);
      }
    };
  }, [dispatch, authData?.tokens?.accessToken, rfqs, allQuotes, quotesLoading, loadAllQuotes]);

  // Handle ?action=create from product page
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      window.queueMicrotask(() => {
        setCreateForm((f) => ({
          ...f,
          productName: searchParams.get("productName") || "",
          productId: searchParams.get("product") || "",
          distributorId: searchParams.get("seller") || "",
          distributorName: searchParams.get("sellerName") || "",
        }));
        setDrawerMode("create");
      });
    }
  }, [searchParams]);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadCreateFormData = useCallback(async () => {
    if (!authData?.tokens?.accessToken) return;
    try {
      const [prodRes, distRes] = await Promise.allSettled([
        productService.fetchAll(),
        userService.getPublicProfiles(1, 100, [UserRole.DISTRIBUTOR]),
      ]);
      if (prodRes.status === "fulfilled") {
        setProducts(
          prodRes.value.data?.docs?.map((p) => ({ _id: p._id, name: p.name })) || []
        );
      }
      if (distRes.status === "fulfilled") {
        setDistributors(distRes.value.data?.docs || []);
      }
    } catch {
      // silent — dropdowns will degrade to text inputs
    }
  }, [authData]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleOpenCreate = useCallback(() => {
    loadCreateFormData();
    setDrawerMode("create");
  }, [loadCreateFormData]);

  const handleSelectReceivedOffersTab = useCallback(() => {
    setActiveTab("sourcing_offers_received");

    if (
      allQuotes === null &&
      !quotesLoading &&
      authData?.tokens?.accessToken
    ) {
      void loadAllQuotes();
    }
  }, [allQuotes, authData?.tokens?.accessToken, loadAllQuotes, quotesLoading]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerMode("none");
    setSelectedRfqDetail(null);
    setSelectedQuote(null);
    setToastMessage(null);
  }, []);

  const handleViewSentRfq = useCallback(
    async (rfq: Rfq) => {
      if (!authData?.tokens?.accessToken) return;
      setIsDetailLoading(true);
      setSelectedRfqDetail(null);
      setDrawerMode("sent_detail");
      try {
        const result = await rfqService.fetchRfqDetail(
          authData.tokens.accessToken,
          rfq._id
        );
        if (result.data) setSelectedRfqDetail(result.data);
      } catch {
        // silent
      } finally {
        setIsDetailLoading(false);
      }
    },
    [authData]
  );

  const handleViewQuote = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
    setDrawerMode("quote_detail");
  }, []);

  const handleCreateRfq = useCallback(async () => {
    if (!authData?.tokens?.accessToken) return;
    if (!createForm.productName || !createForm.distributorId) return;
    setIsSubmitting(true);
    try {
      const result = await rfqService.createRfq(authData.tokens.accessToken, {
        items: [
          {
            product: createForm.productId || createForm.productName,
            productName: createForm.productName,
            quantity: createForm.quantity,
          },
        ],
        targetDistributors: [createForm.distributorId],
        additionalNotes: createForm.additionalNotes || undefined,
        deliveryLocation: createForm.deliveryLocation || undefined,
      });
      if (result.success && result.data) {
        await rfqService.submitRfq(authData.tokens.accessToken, result.data._id);
        dispatch(fetchBuyerRfqs(authData.tokens.accessToken));
        handleCloseDrawer();
        setCreateForm({
          productName: "",
          productId: "",
          distributorId: "",
          distributorName: "",
          quantity: 1,
          deliveryDate: "",
          deliveryLocation: "",
          additionalNotes: "",
        });
        showToast("RFQ sent successfully!");
      }
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  }, [authData, createForm, dispatch, handleCloseDrawer, showToast]);

  const handleSendReminder = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !selectedRfqDetail) return;
    setIsSendingReminder(true);
    try {
      await rfqService.sendReminder(
        authData.tokens.accessToken,
        selectedRfqDetail.rfq._id
      );
      showToast("Reminder sent!");
    } catch {
      // silent
    } finally {
      setIsSendingReminder(false);
    }
  }, [authData, selectedRfqDetail, showToast]);

  const handleAcceptOffer = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !selectedQuote) return;
    setIsAccepting(true);
    try {
      const result = await rfqService.acceptOffer(
        authData.tokens.accessToken,
        selectedQuote._id
      );
      if (result.success && result.data) {
        router.push(`/dashboard/buyer/orders/${result.data._id}`);
      }
    } catch {
      // silent
    } finally {
      setIsAccepting(false);
    }
  }, [authData, selectedQuote, router]);

  const handleRejectOffer = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !selectedQuote) return;
    setIsRejecting(true);
    try {
      await rfqService.rejectOffer(authData.tokens.accessToken, selectedQuote._id);
      setAllQuotes((prev) =>
        prev
          ? prev.map((q) =>
              q._id === selectedQuote._id
                ? { ...q, status: "rejected_by_buyer" as const }
                : q
            )
          : prev
      );
      setSelectedQuote((prev) =>
        prev ? { ...prev, status: "rejected_by_buyer" as const } : prev
      );
      showToast("Quote rejected.");
    } catch {
      // silent
    } finally {
      setIsRejecting(false);
    }
  }, [authData, selectedQuote, showToast]);

  // ── Bulk RFQ handlers ─────────────────────────────────────────────────────

  const handleDownloadTemplate = useCallback(() => {
    const csv = BULK_CSV_HEADERS.join(",") + "\n" + 'Sample Product,100,distributor@example.com,2025-06-01,Lagos Nigeria,Urgent order\n';
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-rfq-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const parseCsvFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setBulkErrors([{ row: 0, message: "CSV must have a header row and at least one data row" }]);
        return;
      }

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf("product_name");
      const qtyIdx = header.indexOf("quantity");
      const emailIdx = header.indexOf("distributor_email");
      const dateIdx = header.indexOf("proposed_delivery_date");
      const locIdx = header.indexOf("delivery_location");
      const noteIdx = header.indexOf("additional_note");

      if (nameIdx < 0 || qtyIdx < 0 || emailIdx < 0) {
        setBulkErrors([{ row: 0, message: "CSV header must include: product_name, quantity, distributor_email" }]);
        return;
      }

      const items: BulkRfqItemPayload[] = [];
      const errors: { row: number; message: string }[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const productName = cols[nameIdx] || "";
        const quantityStr = cols[qtyIdx] || "";
        const distributorEmail = cols[emailIdx] || "";
        const quantity = parseInt(quantityStr, 10);

        if (!productName) {
          errors.push({ row: i + 1, message: "Missing product name" });
          continue;
        }
        if (!distributorEmail) {
          errors.push({ row: i + 1, message: "Missing distributor email" });
          continue;
        }
        if (isNaN(quantity) || quantity < 1) {
          errors.push({ row: i + 1, message: `Invalid quantity: "${quantityStr}"` });
          continue;
        }

        items.push({
          productName,
          quantity,
          distributorEmail,
          proposedDeliveryDate: dateIdx >= 0 ? cols[dateIdx] || undefined : undefined,
          deliveryLocation: locIdx >= 0 ? cols[locIdx] || undefined : undefined,
          additionalNote: noteIdx >= 0 ? cols[noteIdx] || undefined : undefined,
        });
      }

      setBulkItems(items);
      setBulkErrors(errors);
      setBulkResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleBulkFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseCsvFile(file);
      e.target.value = "";
    },
    [parseCsvFile]
  );

  const handleOpenBulkCreate = useCallback(() => {
    setBulkItems([]);
    setBulkErrors([]);
    setBulkTitle("");
    setBulkResult(null);
    setDrawerMode("bulk_create");
  }, []);

  const handleSubmitBulkRfq = useCallback(async () => {
    if (!authData?.tokens?.accessToken || bulkItems.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const result = await rfqService.createBulkRfq(authData.tokens.accessToken, {
        items: bulkItems,
        title: bulkTitle || undefined,
      });
      if (result.success && result.data) {
        setBulkResult({ created: result.data.created, errors: result.data.errors });
        dispatch(fetchBuyerRfqs(authData.tokens.accessToken));
        if (result.data.errors.length === 0) {
          showToast(`${result.data.created} RFQs submitted successfully!`);
        }
      }
    } catch {
      showToast("Failed to submit bulk RFQ");
    } finally {
      setIsBulkSubmitting(false);
    }
  }, [authData, bulkItems, bulkTitle, dispatch, showToast]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const submittedRfqs = rfqs?.filter((r) => r.status !== "draft") || [];
  const filteredSentRfqs =
    sentOffersFilter === "pending"
      ? submittedRfqs.filter((r) => r.status === "submitted")
      : sentOffersFilter === "responded"
        ? submittedRfqs.filter((r) => r.status !== "submitted")
        : submittedRfqs;
  const totalSent = submittedRfqs.length;
  const totalResponded = submittedRfqs.filter((r) => r.status !== "submitted").length;
  const totalPending = submittedRfqs.filter((r) => r.status === "submitted").length;

  const drawerTitle =
    drawerMode === "create"
      ? "Source Item"
      : drawerMode === "bulk_create"
        ? "Bulk RFQ"
        : drawerMode === "sent_detail"
          ? "Source Offer Details"
          : "Quote Details";

  // ── Render: Create RFQ form ───────────────────────────────────────────────

  const renderCreateForm = () => (
    <div className="space-y-6 pt-2">
      <p className="text-sm text-gray2">
        To request for quote(s) fill the form below with the proper information and submit.
      </p>

      {/* Product name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">Product name</label>
        {products.length > 0 ? (
          <select
            value={createForm.productId}
            onChange={(e) => {
              const p = products.find((x) => x._id === e.target.value);
              setCreateForm((f) => ({
                ...f,
                productId: e.target.value,
                productName: p?.name || "",
              }));
            }}
            className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Enter product name"
            value={createForm.productName}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, productName: e.target.value }))
            }
            className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 placeholder:text-gray4 focus:outline-none focus:border-primary"
          />
        )}
      </div>

      {/* Distributor's name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">
          Distributor&apos;s name
        </label>
        {distributors.length > 0 ? (
          <select
            value={createForm.distributorId}
            onChange={(e) => {
              const selectedDistributor = distributors.find(
                (distributor) => distributor._id === e.target.value,
              );
              const selectedName = selectedDistributor
                ? getDistributorDisplayName(selectedDistributor)
                : "";
              setCreateForm((f) => ({
                ...f,
                distributorId: e.target.value,
                distributorName: selectedName,
              }));
            }}
            className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Select distributor</option>
            {createForm.distributorId &&
            createForm.distributorName &&
            !distributors.some((d) => d._id === createForm.distributorId) ? (
              <option value={createForm.distributorId}>
                {createForm.distributorName}
              </option>
            ) : null}
            {distributors.map((d) => (
              <option key={d._id} value={d._id}>
                {getDistributorDisplayName(d) || `${d.firstName} ${d.lastName}`.trim()}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            readOnly
            placeholder="No distributors available"
            value={
              createForm.distributorId
                ? createForm.distributorName || "Unknown distributor"
                : ""
            }
            className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 placeholder:text-gray4 focus:outline-none focus:border-primary"
          />
        )}
      </div>

      {/* Product quantity */}
      <Input
        id="createQty"
        label="Product quantity"
        type="number"
        placeholder="Enter number"
        value={String(createForm.quantity)}
        onValueChange={(v) =>
          setCreateForm((f) => ({ ...f, quantity: parseInt(v) || 1 }))
        }
      />

      {/* Proposed delivery date */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">
          Proposed delivery date
        </label>
        <input
          type="date"
          value={createForm.deliveryDate}
          onChange={(e) =>
            setCreateForm((f) => ({ ...f, deliveryDate: e.target.value }))
          }
          className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Your address (deliveryLocation) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">Your address</label>
        <textarea
          rows={3}
          placeholder="Enter text here..."
          value={createForm.deliveryLocation}
          onChange={(e) =>
            setCreateForm((f) => ({ ...f, deliveryLocation: e.target.value }))
          }
          className="w-full rounded-[14px] border border-gray5 px-4 py-3 text-sm text-gray1 placeholder:text-gray4 focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {/* Additional note */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">Additional note</label>
        <textarea
          rows={3}
          placeholder="Enter text here..."
          value={createForm.additionalNotes}
          onChange={(e) =>
            setCreateForm((f) => ({ ...f, additionalNotes: e.target.value }))
          }
          className="w-full rounded-[14px] border border-gray5 px-4 py-3 text-sm text-gray1 placeholder:text-gray4 focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <Button
        title={isSubmitting ? "Sending..." : "Send Offer"}
        variant="primary"
        size="md"
        onClick={handleCreateRfq}
        disabled={isSubmitting || !createForm.productName || !createForm.distributorId}
        className="w-full"
      />
    </div>
  );

  // ── Render: Bulk Create form ───────────────────────────────────────────────

  const renderBulkCreateForm = () => (
    <div className="space-y-6 pt-2">
      <p className="text-sm text-gray2">
        Upload a CSV file with your RFQ items. Each row becomes a separate RFQ sent to the specified distributor.
      </p>

      {/* Download template */}
      <button
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
      >
        <Download size={16} />
        Download CSV Template
      </button>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">Batch title (optional)</label>
        <input
          type="text"
          placeholder="e.g. Q2 procurement batch"
          value={bulkTitle}
          onChange={(e) => setBulkTitle(e.target.value)}
          className="w-full rounded-[14px] border border-gray5 px-4 py-4 text-sm text-gray1 placeholder:text-gray4 focus:outline-none focus:border-primary"
        />
      </div>

      {/* File upload */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray1 pl-1">Upload CSV</label>
        <label className="flex items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-gray5 px-4 py-8 text-sm text-gray3 cursor-pointer hover:border-primary hover:text-primary transition-colors">
          <Upload size={20} />
          <span>{bulkItems.length > 0 ? `${bulkItems.length} items loaded` : "Click to upload CSV file"}</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleBulkFileUpload}
          />
        </label>
      </div>

      {/* Parse errors */}
      {bulkErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1">
          <p className="text-sm font-medium text-red-700 flex items-center gap-1">
            <AlertCircle size={14} /> {bulkErrors.length} row error{bulkErrors.length > 1 ? "s" : ""}
          </p>
          <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
            {bulkErrors.map((err, i) => (
              <li key={i}>Row {err.row}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview table */}
      {bulkItems.length > 0 && (
        <div className="rounded-xl border border-gray5 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray2">
            Preview — {bulkItems.length} item{bulkItems.length > 1 ? "s" : ""}
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray3">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-left">Distributor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bulkItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-1.5 text-gray3">{idx + 1}</td>
                    <td className="px-3 py-1.5 text-gray1">{item.productName}</td>
                    <td className="px-3 py-1.5 text-gray1">{item.quantity}</td>
                    <td className="px-3 py-1.5 text-gray1 truncate max-w-[140px]">{item.distributorEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission result */}
      {bulkResult && (
        <div className={`rounded-xl border p-4 space-y-1 ${bulkResult.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}`}>
          <p className="text-sm font-medium flex items-center gap-1">
            <CheckCircle2 size={14} className="text-success" /> {bulkResult.created} RFQ{bulkResult.created !== 1 ? "s" : ""} created successfully
          </p>
          {bulkResult.errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-0.5">
              {bulkResult.errors.map((err, i) => (
                <li key={i}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Submit button */}
      {!bulkResult && (
        <Button
          title={isBulkSubmitting ? "Submitting..." : `Submit ${bulkItems.length} RFQ${bulkItems.length !== 1 ? "s" : ""}`}
          variant="primary"
          size="md"
          onClick={handleSubmitBulkRfq}
          disabled={isBulkSubmitting || bulkItems.length === 0}
          className="w-full"
        />
      )}

      {/* Done button after success */}
      {bulkResult && (
        <Button
          title="Done"
          variant="primary"
          size="md"
          onClick={handleCloseDrawer}
          className="w-full"
        />
      )}
    </div>
  );

  // ── Render: Sent RFQ detail ───────────────────────────────────────────────

  const renderSentRfqDetail = () => {
    if (isDetailLoading) {
      return (
        <div className="space-y-3 pt-4">
          <Skeleton className="h-14" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      );
    }
    if (!selectedRfqDetail) return null;

    const { rfq } = selectedRfqDetail;
    const distributor = rfq.targetDistributors[0];
    const distributorRef =
      typeof distributor === "object" && distributor !== null
        ? (distributor as UserRef)
        : null;
    const item = rfq.items[0];

    const statusLabel = sentOfferStatusLabel(rfq.status);
    const isCompleted = rfq.status === "converted_to_order";
    const isClosed = rfq.status === "closed";

    return (
      <div className="space-y-6 pt-2">
        {/* Request Status */}
        <div className={`flex items-center justify-between rounded-2xl border px-6 py-4 ${isCompleted ? "border-[#C3EFCD] bg-[#F0FBF2]" : isClosed ? "border-[#E0E0E0] bg-[#F5F5F5]" : "border-[#FFE079] bg-[#FFF6D9]"}`}>
          <span className="text-base font-medium text-gray1">Request Status</span>
          <span className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${isCompleted ? "bg-[#13a83b]" : isClosed ? "bg-[#9CA3AF]" : "bg-[#FFC000]"}`}>
            {statusLabel}
          </span>
        </div>

        {/* Detail fields */}
        <div className="space-y-5">
          <DetailRow
            label="Distributor's name"
            value={
              distributorRef
                ? `${distributorRef.firstName} ${distributorRef.lastName}`.trim()
                : "—"
            }
          />
          <DetailRow
            label="Distributor's phone number"
            value={distributorRef?.phoneNumber}
          />
          <DetailRow
            label="Distributor's email address"
            value={distributorRef?.email}
          />
          <DetailRow label="Product name" value={item?.productName} />
          <DetailRow
            label="Quantity"
            value={item?.quantity != null ? String(item.quantity) : undefined}
          />
          <DetailRow label="Unit price" value="—" />
          <DetailRow label="Total price" value="—" />
          <DetailRow
            label="Date of request"
            value={new Date(rfq.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <DetailRow label="Delivery address" value={rfq.deliveryLocation} />
          <DetailRow label="Proposed delivery date" value="—" />
          <DetailRow label="Additional note" value={rfq.additionalNotes} />

          {/* Attachments */}
          {rfq.attachments && rfq.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray2">Attachments</span>
              {rfq.attachments.map((att) => (
                <a
                  key={att.cloudinary_id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary underline"
                >
                  <FileText size={14} />
                  {att.originalName || "Attachment"}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Send Reminder */}
        <Button
          title={isSendingReminder ? "Sending..." : "Send Reminder"}
          variant="primary"
          size="md"
          isBusy={isSendingReminder}
          onClick={handleSendReminder}
          disabled={isSendingReminder}
          className="w-full"
        />

        {toastMessage && (
          <p className="text-sm text-success text-center">{toastMessage}</p>
        )}
      </div>
    );
  };

  // ── Render: Quote detail ──────────────────────────────────────────────────

  const renderQuoteDetail = () => {
    if (!selectedQuote) return null;

    const rfq =
      typeof selectedQuote.rfq === "object" && selectedQuote.rfq !== null
        ? (selectedQuote.rfq as Rfq)
        : null;
    const distributor =
      typeof selectedQuote.distributor === "object" &&
      selectedQuote.distributor !== null
        ? (selectedQuote.distributor as UserRef)
        : null;
    const item = rfq?.items[0];
    const canAct = selectedQuote.status === "quoted";

    return (
      <div className="space-y-6 pt-2">
        {/* Status badge */}
        <div>
          <span
            className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-medium ${
              selectedQuote.status === "selected_for_order"
                ? "bg-success-light text-success"
                : selectedQuote.status === "rejected_by_buyer" ||
                    selectedQuote.status === "not_selected"
                  ? "bg-gray-100 text-gray3"
                  : selectedQuote.status === "quoted"
                    ? "bg-primary-light text-primary"
                    : "bg-warning-light text-warning"
            }`}
          >
            {QUOTE_STATUS_LABELS[selectedQuote.status] || selectedQuote.status}
          </span>
        </div>

        {/* Detail fields */}
        <div className="space-y-5">
          <DetailRow
            label="Distributor"
            value={
              distributor
                ? `${distributor.firstName} ${distributor.lastName}`.trim()
                : "—"
            }
          />
          <DetailRow label="Product" value={item?.productName} />
          <DetailRow
            label="Quantity"
            value={item?.quantity != null ? String(item.quantity) : undefined}
          />
          <DetailRow label="Unit price" value={formatCurrency(selectedQuote.pricePerUnit)} />
          <DetailRow label="Total price" value={formatCurrency(selectedQuote.totalPrice)} />
          <DetailRow label="Available model" value={selectedQuote.availableModel} />
          <DetailRow label="Warranty" value={selectedQuote.warranty} />
          <DetailRow
            label="Delivery time"
            value={
              selectedQuote.leadTimeDays != null
                ? `${selectedQuote.leadTimeDays} days`
                : undefined
            }
          />
          <DetailRow label="Stock status" value={selectedQuote.stockStatus} />
          <DetailRow label="Date received" value={formatDate(selectedQuote.createdAt)} />
          <DetailRow label="Notes" value={selectedQuote.notes} />
          <DetailRow label="Terms" value={selectedQuote.terms} />

          {/* Images */}
          {selectedQuote.images && selectedQuote.images.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray2">Images</span>
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}

          {/* Catalogue */}
          {selectedQuote.catalogue && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray2">Catalogue</span>
              <a
                href={selectedQuote.catalogue.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary underline"
              >
                <Download size={14} />
                {selectedQuote.catalogue.originalName || "Catalogue.pdf"}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        {canAct && (
          <div className="flex flex-col gap-3 pt-2">
            <Button
              title={isAccepting ? "Processing..." : "Accept Offer"}
              variant="primary"
              size="md"
              isBusy={isAccepting}
              onClick={handleAcceptOffer}
              disabled={isAccepting || isRejecting}
              className="w-full"
            />
            <Button
              title={isRejecting ? "Rejecting..." : "Reject Offer"}
              variant="secondaryLight"
              size="md"
              isBusy={isRejecting}
              onClick={handleRejectOffer}
              disabled={isAccepting || isRejecting}
              className="w-full"
            />
          </div>
        )}

        {toastMessage && (
          <p className="text-sm text-success text-center">{toastMessage}</p>
        )}
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div>
      <Header
        title="Request For Quotes"
        description="View all and send request for quotes"
        titleClassName="text-xl font-semibold leading-8 text-gray1"
        descriptionClassName="text-sm font-normal leading-5 text-gray2"
      />
      <div className="w-full space-y-4 bg-gray7 p-4 md:px-5 md:py-3">
        {/* Figma 275:7410 — 56px strip, bottom border only, inactive #f9fafb */}
        <div className="flex h-14 w-full overflow-hidden border-b border-[#f3f4f6] bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("sourcing_offer")}
            className={`flex-1 px-2.5 py-4 text-center text-base font-normal leading-6 transition-colors ${
              activeTab === "sourcing_offer"
                ? "bg-primary text-white"
                : "bg-[#f9fafb] text-gray1"
            }`}
          >
            Sourcing Offer
          </button>
          <button
            type="button"
            onClick={handleSelectReceivedOffersTab}
            className={`flex-1 px-2.5 py-4 text-center text-base font-normal leading-6 transition-colors ${
              activeTab === "sourcing_offers_received"
                ? "bg-primary text-white"
                : "bg-[#f9fafb] text-gray1"
            }`}
          >
            Sourcing Offers Recieved
          </button>
        </div>

        {/* Summary + CTAs — Figma 277:7415 rounded 16px */}
        {activeTab === "sourcing_offer" ? (
          <div className="rounded-2xl border border-[#f3f4f6] bg-white px-5 py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5 text-gray1">
                  <p className="text-[32px] font-medium leading-[48px]">
                    {totalSent}
                  </p>
                  <p className="text-lg font-normal leading-7">Total offer sent</p>
                </div>
                <p className="text-base font-normal leading-6 text-gray3">
                  Responded request: {totalResponded}
                  <span className="text-gray5"> | </span>
                  Pending request: {totalPending}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end lg:w-auto">
                <Button
                  title="Bulk RFQ"
                  variant="secondaryLight"
                  size="md"
                  iconLeft={<Plus size={18} strokeWidth={1.75} />}
                  onClick={handleOpenBulkCreate}
                  className="!h-[60px] !w-full !min-w-[230px] !rounded-[14px] !border-secondary !bg-[#fff7f0] !px-4 !text-lg !font-normal !text-secondary sm:!w-auto"
                />
                <Button
                  title="Send RFQ"
                  variant="primary"
                  size="md"
                  iconLeft={<Plus size={18} strokeWidth={1.75} />}
                  onClick={handleOpenCreate}
                  className="!h-[60px] !w-full !min-w-[230px] !rounded-[14px] !px-4 !text-lg !font-normal sm:!w-auto"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Table card — Figma 278:7434 */}
        <div className="min-h-[calc(100vh-18rem)] overflow-hidden rounded-2xl border border-[#f3f4f6] bg-white">
          {activeTab === "sourcing_offer" && (
            <div className="flex h-14 items-center justify-between border-b border-[#f3f4f6] px-5">
              <h2 className="text-xl font-medium leading-8 text-gray1">
                All Offer Sent
              </h2>
              <label className="relative inline-flex h-[50px] min-w-[200px] shrink-0 cursor-pointer items-center gap-2 rounded-[11px] border border-[#dde0e5] bg-[#f9fafb] px-2">
                <Filter className="pointer-events-none size-[22px] shrink-0 text-gray3" aria-hidden />
                <span className="sr-only">Filter offers</span>
                <select
                  value={sentOffersFilter}
                  onChange={(e) => setSentOffersFilter(e.target.value)}
                  className="h-full min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent pr-7 text-[17.9px] font-normal leading-7 text-gray2 outline-none"
                >
                  <option value="all">All Quote</option>
                  <option value="responded">Responded</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 size-[22px] -translate-y-1/2 text-gray3"
                  aria-hidden
                />
              </label>
            </div>
          )}

          {activeTab === "sourcing_offers_received" && (
            <div className="border-b border-[#f3f4f6] px-5 py-6">
              <h2 className="text-xl font-medium leading-8 text-gray1">
                Sourcing Offers Recieved
              </h2>
            </div>
          )}

          <div className="px-5 pb-5 pt-4">
            {/* ── Sourcing Offer ────────────────────────────────────────── */}
            {activeTab === "sourcing_offer" &&
              (isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : submittedRfqs.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList />}
                  title="No RFQs sent yet"
                  description="Click &apos;Send RFQ&apos; to request a quote from a distributor"
                />
              ) : filteredSentRfqs.length === 0 ? (
                <p className="py-10 text-center text-base text-gray3">
                  No offers match this filter.
                </p>
              ) : (
                  <Table
                    containerClassName="max-h-[min(876px,calc(100vh-22rem))] overflow-x-auto overflow-y-auto"
                    className="w-max min-w-full table-fixed"
                  >
                  <TableHeader className="[&_tr]:!bg-white [&_tr:hover]:!bg-white sticky top-0 z-[1] bg-white">
                    <TableRow className="border-0 hover:!bg-transparent data-[state=selected]:bg-white">
                      <TableHead className="h-11 whitespace-nowrap bg-white text-base font-medium leading-7 text-gray3">
                        Distributor&apos;s name
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Product&apos;s name
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Qty
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Unit price
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Total price
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Delivery time
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Status
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSentRfqs.map((rfq) => (
                      <TableRow
                        key={rfq._id}
                        className="border-b border-[#f3f4f6] hover:!bg-transparent data-[state=selected]:bg-white"
                      >
                        <TableCell className="h-12 py-0 leading-6">
                          <div className="flex items-center gap-3">
                            <span
                              className="inline-flex size-8 shrink-0 rounded-lg bg-[#d9d9d9]"
                              aria-hidden
                            />
                            <span className="text-base font-normal text-black">
                              {rfq.targetDistributors.length > 0
                                ? getDistributorName(rfq.targetDistributors[0])
                                : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-12 py-0 text-base font-normal text-black">
                          {rfq.items[0]?.productName || "—"}
                        </TableCell>
                        <TableCell className="h-12 py-0 text-base font-normal text-black">
                          {rfq.items[0]?.quantity || "—"}
                        </TableCell>
                        <TableCell className="h-12 py-0 text-base font-normal text-black">
                          {formatCurrency(acceptedQuoteByRfqId.get(rfq._id)?.pricePerUnit)}
                        </TableCell>
                        <TableCell className="h-12 py-0 text-base font-normal text-black">
                          {(() => {
                            const q = acceptedQuoteByRfqId.get(rfq._id);
                            if (!q) return "—";
                            const total = q.totalPrice ?? (q.pricePerUnit != null ? q.pricePerUnit * (q.quantity ?? rfq.items[0]?.quantity ?? 1) : undefined);
                            return formatCurrency(total);
                          })()}
                        </TableCell>
                        <TableCell className="h-12 py-0 text-base font-normal text-gray1">
                          {acceptedQuoteByRfqId.get(rfq._id)?.leadTimeDays != null
                            ? `${acceptedQuoteByRfqId.get(rfq._id)!.leadTimeDays} days`
                            : "—"}
                        </TableCell>
                        <TableCell className="h-12 py-0">
                          <span
                            className={`text-base font-normal ${rfqStatusColor(rfq.status)}`}
                          >
                            {sentOfferStatusLabel(rfq.status)}
                          </span>
                        </TableCell>
                        <TableCell className="h-12 py-0">
                          <button
                            type="button"
                            onClick={() => handleViewSentRfq(rfq)}
                            className="inline-flex cursor-pointer items-center gap-2 text-base font-normal text-[#13a83b]"
                          >
                            <Eye className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />{" "}
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ))}

            {/* ── Sourcing Offers Received ───────────────────────────────── */}
            {activeTab === "sourcing_offers_received" &&
              (quotesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !allQuotes || allQuotes.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList />}
                  title="No quotes received yet"
                  description="Distributors will respond to your RFQs here"
                />
              ) : (
                  <Table
                    containerClassName="max-h-[min(876px,calc(100vh-22rem))] overflow-x-auto overflow-y-auto"
                    className="w-max min-w-full table-fixed"
                  >
                  <TableHeader className="[&_tr]:!bg-white [&_tr:hover]:!bg-white sticky top-0 z-[1] bg-white">
                    <TableRow className="border-0 hover:!bg-transparent">
                      <TableHead className="h-11 bg-white text-base font-medium leading-7 text-gray3">
                        Distributor
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Product
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Qty
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Unit price
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Total price
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Date received
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Status
                      </TableHead>
                      <TableHead className="bg-white text-base font-medium leading-7 text-gray3">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allQuotes.map((q) => {
                      const rfq =
                        typeof q.rfq === "object" && q.rfq !== null
                          ? (q.rfq as Rfq)
                          : null;
                      return (
                        <TableRow
                          key={q._id}
                          className="border-b border-[#f3f4f6] hover:!bg-transparent"
                        >
                          <TableCell className="h-12 py-0">
                            <div className="flex items-center gap-3">
                              <span
                                className="inline-flex size-8 shrink-0 rounded-lg bg-[#d9d9d9]"
                                aria-hidden
                              />
                              <span className="text-base font-normal text-black">
                                {getDistributorName(q.distributor)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="h-12 py-0 text-base font-normal text-black">
                            {rfq?.items[0]?.productName || "—"}
                          </TableCell>
                          <TableCell className="h-12 py-0 text-base font-normal text-black">
                            {rfq?.items[0]?.quantity || "—"}
                          </TableCell>
                          <TableCell className="h-12 py-0 text-base font-normal text-black">
                            {formatCurrency(q.pricePerUnit)}
                          </TableCell>
                          <TableCell className="h-12 py-0 text-base font-normal text-black">
                            {formatCurrency(q.totalPrice)}
                          </TableCell>
                          <TableCell className="h-12 py-0 text-base font-normal text-gray1">
                            {formatDate(q.createdAt)}
                          </TableCell>
                          <TableCell className="h-12 py-0">
                            <span
                              className={`text-base font-normal ${quoteStatusColor(q.status)}`}
                            >
                              {QUOTE_STATUS_LABELS[q.status] || q.status}
                            </span>
                          </TableCell>
                          <TableCell className="h-12 py-0">
                            <button
                              type="button"
                              onClick={() => handleViewQuote(q)}
                              className="inline-flex cursor-pointer items-center gap-2 text-base font-normal text-[#13a83b]"
                            >
                              <Eye className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />{" "}
                              View
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ))}
          </div>
        </div>
      </div>

      {/* Global toast */}
      {toastMessage && drawerMode === "none" && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-gray1 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Right drawer */}
      <RightSlider
        open={drawerMode !== "none"}
        onClose={handleCloseDrawer}
        title={drawerTitle}
      >
        {drawerMode === "create" && renderCreateForm()}
        {drawerMode === "bulk_create" && renderBulkCreateForm()}
        {drawerMode === "sent_detail" && renderSentRfqDetail()}
        {drawerMode === "quote_detail" && renderQuoteDetail()}
      </RightSlider>
    </div>
  );
}
