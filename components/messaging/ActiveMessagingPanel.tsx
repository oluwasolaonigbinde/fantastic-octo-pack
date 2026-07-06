"use client";

import {
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CreditCard,
  EllipsisVertical,
  MessageCircleMore,
  Package,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useMyProductsQuery } from "@/hooks/queries/products";
import {
  useCreateOrderOnBehalfMutation,
  useSendMessageMutation,
  useStartConversationMutation,
  useThreadQuery,
  useThreadsQuery,
} from "@/hooks/queries/messaging";
import { queryKeys } from "@/lib/query-keys";
import orderService from "@/services/orderService";
import type { Conversation, Message } from "@/types/messaging";
import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS, formatDeliveryAddress } from "@/types/order";
import type { Product } from "@/types/product";
import { UserRole } from "@/types/user";

interface ActiveMessagingPanelProps {
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Order totals come back from the API in naira. */
const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

/** Short, human-friendly order reference for the message cards. */
const getOrderDisplayId = (orderId?: string) =>
  orderId ? `#${orderId.slice(-8).toUpperCase()}` : "--";

/** Statuses where the buyer has already paid — no Confirm/Pay actions remain. */
const PAID_ORDER_STATUSES = new Set([
  "paid",
  "processing",
  "fulfilled",
  "completed",
  "closed",
]);

const formatConversationTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat("en", {
    month: isSameDay ? undefined : "short",
    day: isSameDay ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatMessageTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getConversationActivity = (conversation: Conversation) =>
  conversation.lastMessageAt ?? conversation.createdAt;

const buildInitials = (name?: string | null) => {
  const tokens = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (tokens.length === 0) return "?";
  if (tokens.length === 1) return tokens[0].slice(0, 1).toUpperCase();
  return `${tokens[0].slice(0, 1)}${tokens[1].slice(0, 1)}`.toUpperCase();
};

const getProductPrice = (product?: Product) =>
  Number.isFinite(product?.pricePerUnit) ? Number(product?.pricePerUnit) : 0;

const AvatarCircle = ({
  name,
  avatarUrl,
  className = "",
}: {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const src = imageFailed ? null : avatarUrl || DEFAULT_AVATAR_SRC;
  const initials = buildInitials(name);
  const wrapperClassName = `relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#E5E7EB] text-xs font-semibold text-[#475467] ${className}`.trim();

  if (!src) {
    return (
      <span className={wrapperClassName} aria-label={name || "Conversation avatar"}>
        {initials}
      </span>
    );
  }

  return (
    <span className={wrapperClassName}>
      <Image
        src={src}
        alt={name || "Conversation avatar"}
        fill
        sizes="48px"
        className="object-cover"
        onError={() => setImageFailed(true)}
      />
    </span>
  );
};

function DistributorOrderModal({
  open,
  onClose,
  products,
  isLoadingProducts,
  productError,
  buyerName,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  isLoadingProducts: boolean;
  productError: string | null;
  buyerName: string;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (input: {
    productId: string;
    quantity: number;
    notes: string;
  }) => void;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const productsById = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );

  const selectedProduct = productsById.get(productId);
  const unitPrice = getProductPrice(selectedProduct);
  const grandTotal = unitPrice * quantity;
  const canSubmit = Boolean(productId) && quantity > 0 && !isSubmitting;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/45 px-4 py-6">
      <div
        className="max-h-[92vh] w-full max-w-[860px] overflow-hidden rounded-[16px] border border-[#E7ECF3] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-order-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7ECF3] px-5 py-4">
          <div>
            <h2 id="create-order-title" className="text-base font-semibold text-[#111827]">
              Create Order for {buyerName}
            </h2>
            <p className="mt-1 text-xs text-[#667085]">
              Draft an order from your catalogue. {buyerName} reviews it in this
              chat, adds a delivery address, and pays.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DDE0E5] px-4 text-sm text-[#475467]"
          >
            Close
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5 p-5">
            {productError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {productError}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#475467]">
                Product / Model
              </span>
              <select
                value={productId}
                disabled={isLoadingProducts || isSubmitting}
                onChange={(event) => setProductId(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none focus:border-primary disabled:bg-[#F2F4F7]"
              >
                <option value="">
                  {isLoadingProducts ? "Loading products..." : "Select product"}
                </option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[#475467]">
                  Quantity
                </span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[#475467]">
                  Unit Price
                </span>
                <input
                  value={formatNaira(unitPrice)}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-[#F8FAFC] px-3 text-sm text-[#111827] outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#475467]">
                Note for buyer (optional)
              </span>
              <textarea
                value={notes}
                disabled={isSubmitting}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={300}
                placeholder="Add any details about this order"
                className="h-24 w-full resize-none rounded-lg border border-[#DDE0E5] px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-primary"
              />
            </label>

            {submitError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}
          </div>

          <aside className="border-t border-[#E7ECF3] bg-white p-5 lg:border-l lg:border-t-0">
            <div className="sticky top-5 space-y-4">
              <section className="rounded-xl border border-[#E7ECF3] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">Order Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Product</span>
                    <span className="max-w-[150px] truncate text-right text-[#111827]">
                      {selectedProduct?.name ?? "--"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Quantity</span>
                    <span className="text-[#111827]">{quantity}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Unit price</span>
                    <span className="text-[#111827]">{formatNaira(unitPrice)}</span>
                  </div>
                </div>
                <div className="mt-5 flex justify-between gap-4 rounded-lg bg-[#EAF6FF] px-3 py-3 text-sm font-semibold text-primary">
                  <span>Estimated Total</span>
                  <span>{formatNaira(grandTotal)}</span>
                </div>
              </section>

              <div className="rounded-xl border border-[#B9E6FE] bg-[#F5FBFF] p-4">
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Secure Transaction</p>
                    <p className="mt-1 text-xs text-[#667085]">
                      Funds are held in BAIY escrow until the buyer confirms
                      delivery.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => onSubmit({ productId, quantity, notes: notes.trim() })}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting ? "Sending to buyer…" : "Send Order to Buyer"}
                <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders an order system message (`order_proposal` / `order_created`) as a rich
 * card. The message only carries the order id, so the card fetches the order to
 * show its name, status and total. Buyers get Confirm/Pay actions on an unpaid
 * proposal; everyone else gets a read-only "See details" link.
 */
function OrderMessageCard({
  message,
  token,
  viewerRole,
}: {
  message: Message;
  token: string;
  viewerRole: UserRole | string | undefined;
}) {
  const router = useRouter();
  const orderId = message.attachment?.order ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  // Lazily seed the loading flag so the effect never has to setState
  // synchronously (orderId/token are stable for a card's lifetime).
  const [isLoading, setIsLoading] = useState(() => Boolean(orderId && token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !token) return;

    let active = true;

    orderService
      .fetchOrderDetail(token, orderId)
      .then((response) => {
        if (active) setOrder(response.data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load order");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId, token]);

  const isBuyer = viewerRole === UserRole.BUYER;
  const isProposal = message.type === "order_proposal";
  const status = order?.status ?? "";
  const isPaid = PAID_ORDER_STATUSES.has(status);
  const canAct = isBuyer && isProposal && !isPaid && Boolean(orderId);
  const detailBase = isBuyer
    ? "/dashboard/buyer/orders"
    : "/dashboard/distributor/orders";

  const heading = isProposal ? "Order generated" : "New order placed";
  const productName = order?.productName || "Order item";
  const statusLabel = ORDER_STATUS_LABELS[status] ?? (status || "Pending");

  return (
    <div className="w-full max-w-[420px] rounded-[18px] border border-[#D6EBFF] bg-[#F2F9FF] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#1B2432]">{heading}</p>
        {orderId ? (
          <button
            type="button"
            onClick={() => router.push(`${detailBase}/${orderId}`)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            See details
            <ArrowRight size={13} />
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-[#667085]">Loading order…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-[#9F1239]">{error}</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
              <Package size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1B2432]">
                {productName}
              </p>
              <p className="mt-0.5 truncate text-xs text-[#667085]">
                {order?.quantity ? `Qty ${order.quantity} · ` : ""}
                {order ? formatNaira(order.totalPrice) : ""}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white p-3">
            <div>
              <p className="text-[11px] text-[#8A94A6]">Order status</p>
              <p className="mt-1 text-xs font-medium text-[#111827]">{statusLabel}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8A94A6]">Invoice ID</p>
              <p className="mt-1 text-xs font-medium text-[#111827]">
                {getOrderDisplayId(orderId)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#8A94A6]">Shipping address</p>
              <p className="mt-1 text-xs font-medium text-[#111827]">
                {formatDeliveryAddress(order?.deliveryAddress) ||
                  "Not set — add during review"}
              </p>
            </div>
          </div>

          {canAct ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(`${detailBase}/${orderId}?view=edit`)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm font-semibold text-white"
              >
                Confirm order
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => router.push(`${detailBase}/${orderId}?view=payment`)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#FF6B00] px-4 text-sm font-semibold text-[#FF6B00]"
              >
                <CreditCard size={15} />
                Make payment
              </button>
            </div>
          ) : isProposal && isBuyer && isPaid ? (
            <p className="mt-3 text-xs font-medium text-[#16A34A]">
              Payment completed for this order.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ActiveMessagingPanel({
  emptyTitle = "Select a conversation",
  emptyDescription = "Choose a thread from the conversation list.",
}: ActiveMessagingPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const authUser = useAppSelector((state) => state.auth.data);
  const token = authUser?.tokens?.accessToken;

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const processedComposeKey = useRef<string | null>(null);
  const shouldFocusComposer = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const THREADS_LIMIT = 20;
  const threadsQuery = useThreadsQuery(THREADS_LIMIT);
  const conversations = useMemo(
    () => threadsQuery.data ?? [],
    [threadsQuery.data],
  );
  const isLoadingList = threadsQuery.isLoading;

  const threadQuery = useThreadQuery(activeConversationId ?? undefined);
  const detail = threadQuery.data ?? null;
  const isLoadingThread = threadQuery.isLoading && Boolean(activeConversationId);

  const sendMessageMutation = useSendMessageMutation();
  const startConversationMutation = useStartConversationMutation();
  const createOrderMutation = useCreateOrderOnBehalfMutation();

  const isSending = sendMessageMutation.isPending;
  const isCreatingOrder = createOrderMutation.isPending;

  const activeError =
    threadsQuery.error ?? threadQuery.error ?? sendMessageMutation.error;
  const error = activeError instanceof Error ? activeError.message : null;

  const activeConversation = useMemo(
    () =>
      detail?.conversation ??
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, conversations, detail?.conversation],
  );

  const canCreateOrder =
    authUser?.role === UserRole.DISTRIBUTOR &&
    activeConversation?.counterpart.role === UserRole.BUYER;

  const myProductsQuery = useMyProductsQuery(authUser?._id, {
    enabled: isCreateOrderOpen && Boolean(canCreateOrder),
  });
  const orderProducts: Product[] = myProductsQuery.data?.products ?? [];
  const isLoadingOrderProducts = myProductsQuery.isLoading && isCreateOrderOpen;
  const orderProductError =
    myProductsQuery.error instanceof Error
      ? myProductsQuery.error.message
      : myProductsQuery.error
        ? "Unable to load catalogue products"
        : null;

  const filteredConversations = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name = conversation.counterpart.displayName.toLowerCase();
      const preview = conversation.lastMessagePreview?.toLowerCase() ?? "";
      const secondary = conversation.counterpart.secondaryLabel?.toLowerCase() ?? "";

      return (
        name.includes(normalizedQuery) ||
        preview.includes(normalizedQuery) ||
        secondary.includes(normalizedQuery)
      );
    });
  }, [conversations, deferredSearchQuery]);

  // Pick the first conversation once the list loads, and recover if the active
  // one disappears from the list (the queries poll in the background).
  useEffect(() => {
    if (conversations.length === 0) return;

    setActiveConversationId((current) => {
      if (!current) return conversations[0]?.id ?? null;
      if (conversations.some((c) => c.id === current)) return current;
      return conversations[0]?.id ?? current;
    });
  }, [conversations]);

  useEffect(() => {
    if (!shouldFocusComposer.current || !activeConversation) {
      return;
    }

    inputRef.current?.focus();
    shouldFocusComposer.current = false;
  }, [activeConversation]);

  useEffect(() => {
    if (!token) return;

    const compose = searchParams.get("compose");
    const receiverId = searchParams.get("to")?.trim() ?? "";
    const composeKey = `${compose ?? ""}:${receiverId ?? ""}`;

    if (compose === "1" && !receiverId) {
      router.replace(pathname, { scroll: false });
      return;
    }

    if (compose !== "1" || processedComposeKey.current === composeKey) {
      return;
    }

    processedComposeKey.current = composeKey;
    setComposeError(null);

    startConversationMutation.mutate(receiverId, {
      onSuccess: (conversation) => {
        // Seed the freshly started conversation into the cached list so it shows
        // immediately; the background invalidation reconciles it afterwards.
        qc.setQueryData<Conversation[]>(
          queryKeys.messaging.threads(authUser?._id ?? "anonymous", THREADS_LIMIT),
          (current = []) => {
            const withoutDuplicate = current.filter(
              (item) => item.id !== conversation.id,
            );
            return [conversation, ...withoutDuplicate];
          },
        );
        setComposeError(null);
        shouldFocusComposer.current = true;
        setActiveConversationId(conversation.id);
      },
      onError: (err) => {
        const fallbackConversationId =
          activeConversationId ?? conversations[0]?.id ?? null;
        setActiveConversationId(fallbackConversationId);
        setComposeError(
          fallbackConversationId
            ? null
            : err instanceof Error
              ? err.message
              : "Conversation could not be started.",
        );
        router.replace(pathname, { scroll: false });
      },
    });
  }, [
    activeConversationId,
    authUser?._id,
    conversations,
    pathname,
    qc,
    router,
    searchParams,
    startConversationMutation,
    token,
  ]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();
    if (!token || !activeConversationId || !text || isSending) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        text,
      });
      setDraft("");
      inputRef.current?.focus();
    } catch {
      // Error surfaced via `sendMessageMutation.error` (see `error`).
    }
  };

  // Distributor drafts an order for the buyer via POST /orders/on-behalf. The
  // backend prices it, creates a `draft_pending_buyer` order, and posts an
  // `order_proposal` message into this conversation — the mutation invalidates
  // the thread so the new order card renders.
  const handleCreateOrder = async (input: {
    productId: string;
    quantity: number;
    notes: string;
  }) => {
    const buyerId = activeConversation?.counterpart.id;
    if (!token || !buyerId || !activeConversationId || isCreatingOrder) return;

    setCreateOrderError(null);

    try {
      await createOrderMutation.mutateAsync({
        conversationId: activeConversationId,
        payload: {
          buyer: buyerId,
          product: input.productId,
          quantity: input.quantity,
          notes: input.notes || undefined,
        },
      });
      setIsCreateOrderOpen(false);
    } catch (err) {
      setCreateOrderError(
        err instanceof Error ? err.message : "Unable to create order",
      );
    }
  };

  const showEmptyState = !activeConversationId || !activeConversation;
  const hasSearchMatches = filteredConversations.length > 0;

  return (
    <section
      className="p-4 md:p-6"
      aria-label="Messaging"
      data-testid="active-messaging-panel"
    >
      <div className="overflow-hidden rounded-[24px] border border-[#E7ECF3] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="grid h-[calc(100vh-220px)] min-h-[540px] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-[#E7ECF3] md:border-b-0 md:border-r">
            <div className="border-b border-[#E7ECF3] p-4">
              <label
                className="flex items-center gap-3 rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-3"
                htmlFor="message-search"
              >
                <input
                  id="message-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for chat"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2937] placeholder:text-[#98A2B3] focus:outline-none"
                />
                <Search size={18} className="text-[#667085]" />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto" data-testid="conversation-list">
              {filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`flex w-full items-start gap-3 border-b border-[#EEF2F7] px-4 py-4 text-left transition-colors hover:bg-[#F7FBFF] ${
                      isActive ? "bg-[#EAF6FF]" : "bg-white"
                    }`}
                    data-testid="conversation-list-item"
                  >
                    <AvatarCircle
                      name={conversation.counterpart.displayName}
                      avatarUrl={conversation.counterpart.avatarUrl}
                      className="size-11 shrink-0"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-[#1B2432]">
                          {conversation.counterpart.displayName}
                        </span>
                        <span className="shrink-0 text-xs text-[#667085]">
                          {formatConversationTime(getConversationActivity(conversation))}
                        </span>
                      </span>

                      <span className="mt-1 block truncate text-sm text-[#475467]">
                        {conversation.lastMessagePreview || "No messages in this conversation yet."}
                      </span>
                    </span>
                  </button>
                );
              })}

              {!isLoadingList && conversations.length === 0 ? (
                <div className="px-4 py-10 text-sm text-[#667085]">
                  No conversations yet.
                </div>
              ) : null}

              {!isLoadingList && conversations.length > 0 && !hasSearchMatches ? (
                <div className="px-4 py-10 text-sm text-[#667085]">
                  No conversations match your search.
                </div>
              ) : null}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col" data-testid="thread-view">
            {showEmptyState ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-sm text-center text-[#667085]">
                  <MessageCircleMore size={42} className="mx-auto mb-3 opacity-30" />
                  <h2 className="text-base font-semibold text-[#1B2432]">{emptyTitle}</h2>
                  <p className="mt-2 text-sm">{composeError ?? emptyDescription}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-[#E7ECF3] px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarCircle
                      name={activeConversation.counterpart.displayName}
                      avatarUrl={activeConversation.counterpart.avatarUrl}
                      className="size-12 shrink-0"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#1B2432]">
                        {activeConversation.counterpart.displayName}
                      </p>
                      {activeConversation.counterpart.secondaryLabel ? (
                        <p className="mt-1 text-xs font-medium text-[#16A34A]">
                          {activeConversation.counterpart.secondaryLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-2xl bg-[#EEF8FF] text-[#667085]"
                    aria-label="Conversation options"
                  >
                    <EllipsisVertical size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white p-5">
                  {composeError ? (
                    <p className="rounded-lg border border-[#F8D7DA] bg-[#FFF5F5] px-3 py-2 text-sm text-[#9F1239]">
                      {composeError}
                    </p>
                  ) : null}

                  {!isLoadingThread && detail?.messages.length === 0 ? (
                    <p className="text-center text-sm text-[#667085]">
                      No messages in this conversation yet.
                    </p>
                  ) : null}

                  {detail?.messages.map((message) => {
                    const isMine = message.senderId === authUser?._id;
                    const isOrderCard =
                      (message.type === "order_proposal" ||
                        message.type === "order_created") &&
                      Boolean(message.attachment?.order);

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine ? (
                          <AvatarCircle
                            name={activeConversation.counterpart.displayName}
                            avatarUrl={activeConversation.counterpart.avatarUrl}
                            className="size-10 shrink-0"
                          />
                        ) : null}

                        {isOrderCard && token ? (
                          <OrderMessageCard
                            message={message}
                            token={token}
                            viewerRole={authUser?.role}
                          />
                        ) : (
                          <div
                            className={`max-w-[78%] rounded-[20px] px-4 py-3 text-sm leading-6 ${
                              isMine ? "bg-[#0669D9] text-white" : "bg-[#EAF6FF] text-[#1B2432]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.text}</p>
                            <p
                              className={`mt-2 text-right text-xs ${
                                isMine ? "text-white/75" : "text-[#667085]"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSend}
                  className="border-t border-[#E7ECF3] p-4"
                  data-testid="message-form"
                >
                  {error ? (
                    <p className="mb-3 text-sm text-[#9F1239]" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex items-center gap-2 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write your message here..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#1F2937] placeholder:text-[#98A2B3] focus:outline-none"
                      aria-label="Message text"
                      data-testid="message-input"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || isSending}
                      className="inline-flex size-12 items-center justify-center rounded-[16px] bg-[#0669D9] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label="Send message"
                      data-testid="send-message-button"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  {canCreateOrder ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCreateOrderError(null);
                        setIsCreateOrderOpen(true);
                      }}
                      className="mt-3 inline-flex h-11 min-w-[180px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      Create Order
                    </button>
                  ) : null}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      {isCreateOrderOpen ? (
        <DistributorOrderModal
          open={isCreateOrderOpen}
          onClose={() => setIsCreateOrderOpen(false)}
          products={orderProducts}
          isLoadingProducts={isLoadingOrderProducts}
          productError={orderProductError}
          buyerName={activeConversation?.counterpart.displayName ?? "buyer"}
          isSubmitting={isCreatingOrder}
          submitError={createOrderError}
          onSubmit={handleCreateOrder}
        />
      ) : null}
    </section>
  );
}
