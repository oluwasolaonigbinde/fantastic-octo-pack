"use client";

import {
  FormEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  EllipsisVertical,
  MessageCircleMore,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { useAppSelector } from "@/hooks/useAppSelector";
import messagingService from "@/services/messagingService";
import productService from "@/services/productService";
import type { Conversation, ConversationDetail } from "@/types/messaging";
import type { Product } from "@/types/product";
import { UserRole } from "@/types/user";

interface ActiveMessagingPanelProps {
  emptyTitle?: string;
  emptyDescription?: string;
}

const POLL_INTERVAL_MS = 15000;

type OrderDraftItem = {
  id: string;
  productId: string;
  quantity: number;
  note: string;
};

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const getProductPrice = (product?: Product) =>
  Number.isFinite(product?.pricePerUnit) ? Number(product?.pricePerUnit) : 0;

const getAvailabilityLabel = (value?: Product["availability_status"]) => {
  if (!value) return "Not specified";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getConditionLabel = (value?: Product["condition"]) => {
  if (!value) return "Not specified";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

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
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  isLoadingProducts: boolean;
  productError: string | null;
}) {
  const [items, setItems] = useState<OrderDraftItem[]>([
    { id: "item-1", productId: "", quantity: 1, note: "" },
  ]);
  const [orderNote, setOrderNote] = useState("");

  const productsById = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );

  const subtotal = items.reduce((total, item) => {
    const product = productsById.get(item.productId);
    return total + getProductPrice(product) * item.quantity;
  }, 0);
  const deliveryFee = 0;
  const tax = 0;
  const grandTotal = subtotal + deliveryFee + tax;

  const setItemValue = <K extends keyof OrderDraftItem>(
    itemId: string,
    key: K,
    value: OrderDraftItem[K],
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { id: `item-${Date.now()}`, productId: "", quantity: 1, note: "" },
    ]);
  };

  const removeItem = (itemId: string) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== itemId),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/45 px-4 py-6">
      <div
        className="max-h-[92vh] w-full max-w-[1120px] overflow-hidden rounded-[16px] border border-[#E7ECF3] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-order-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7ECF3] px-5 py-4">
          <div>
            <h2 id="create-order-title" className="text-base font-semibold text-[#111827]">
              Create New Order
            </h2>
            <p className="mt-1 text-xs text-[#667085]">
              Product selection is wired to your catalogue. Final order creation is paused pending client confirmation.
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

        <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 p-5">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  1
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">Order Information</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="block rounded-lg border border-[#DDE0E5] bg-white p-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <Truck size={14} className="text-primary" />
                    Delivery
                  </span>
                  <select
                    disabled
                    className="mt-3 h-10 w-full rounded-lg border border-[#E7ECF3] bg-[#F8FAFC] px-3 text-xs text-[#667085]"
                  >
                    <option>Awaiting client options</option>
                  </select>
                </label>

                <label className="block rounded-lg border border-[#DDE0E5] bg-white p-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <ShieldCheck size={14} className="text-primary" />
                    Warranty
                  </span>
                  <select
                    disabled
                    className="mt-3 h-10 w-full rounded-lg border border-[#E7ECF3] bg-[#F8FAFC] px-3 text-xs text-[#667085]"
                  >
                    <option>Awaiting client options</option>
                  </select>
                </label>

                <label className="block rounded-lg border border-[#DDE0E5] bg-white p-3">
                  <span className="text-xs font-semibold text-[#111827]">
                    Additional Note
                  </span>
                  <textarea
                    value={orderNote}
                    onChange={(event) => setOrderNote(event.target.value)}
                    maxLength={300}
                    placeholder="Type order-level note here"
                    className="mt-3 h-10 w-full resize-none rounded-lg border border-[#E7ECF3] px-3 py-2 text-xs text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-primary"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    2
                  </span>
                  <h3 className="text-sm font-semibold text-[#111827]">Order Items</h3>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary"
                >
                  <Plus size={16} />
                  Add Another Item
                </button>
              </div>

              {productError ? (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {productError}
                </p>
              ) : null}

              <div className="space-y-4">
                {items.map((item, index) => {
                  const selectedProduct = productsById.get(item.productId);
                  const unitPrice = getProductPrice(selectedProduct);
                  const total = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#EEF2F7] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[#E7ECF3] pb-3">
                        <p className="text-sm font-semibold text-[#111827]">
                          {index + 1}. Product Information
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#F04438] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                          Remove Item
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Category
                          </span>
                          <input
                            value={selectedProduct?.category ?? ""}
                            readOnly
                            placeholder="Select a product first"
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Product / Model
                          </span>
                          <select
                            value={item.productId}
                            disabled={isLoadingProducts}
                            onChange={(event) =>
                              setItemValue(item.id, "productId", event.target.value)
                            }
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

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Condition
                          </span>
                          <input
                            value={getConditionLabel(selectedProduct?.condition)}
                            readOnly
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Availability
                          </span>
                          <input
                            value={getAvailabilityLabel(selectedProduct?.availability_status)}
                            readOnly
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Quantity
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              setItemValue(
                                item.id,
                                "quantity",
                                Math.max(1, Number(event.target.value) || 1),
                              )
                            }
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Unit Price
                          </span>
                          <input
                            value={formatCurrency(unitPrice)}
                            readOnly
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none"
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Item Note
                          </span>
                          <input
                            value={item.note}
                            onChange={(event) =>
                              setItemValue(item.id, "note", event.target.value)
                            }
                            placeholder="Optional item-specific note"
                            className="h-11 w-full rounded-lg border border-[#DDE0E5] bg-white px-3 text-sm text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-primary"
                          />
                        </label>
                        <div>
                          <span className="mb-2 block text-xs font-medium text-[#475467]">
                            Total Price
                          </span>
                          <p className="flex h-11 items-center rounded-lg bg-[#EEF8FF] px-3 text-sm font-semibold text-primary">
                            {formatCurrency(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="border-t border-[#E7ECF3] bg-white p-5 lg:border-l lg:border-t-0">
            <div className="sticky top-5 space-y-4">
              <section className="rounded-xl border border-[#E7ECF3] p-4">
                <h3 className="text-sm font-semibold text-[#111827]">Order Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Items ({items.length})</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-[#475467]">
                    <span>Tax (TBD)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                </div>
                <div className="mt-5 flex justify-between gap-4 rounded-lg bg-[#EAF6FF] px-3 py-3 text-sm font-semibold text-primary">
                  <span>Grand Total (USD)</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </section>

              <div className="rounded-xl border border-[#B9E6FE] bg-[#F5FBFF] p-4">
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Secure Transaction</p>
                    <p className="mt-1 text-xs text-[#667085]">
                      Payment wiring is intentionally not connected yet.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white opacity-45"
                title="Waiting for client confirmation before order creation is enabled"
              >
                Review & Create Order
                <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      </div>
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
  const authUser = useAppSelector((state) => state.auth.data);
  const token = authUser?.tokens?.accessToken;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderProducts, setOrderProducts] = useState<Product[]>([]);
  const [isLoadingOrderProducts, setIsLoadingOrderProducts] = useState(false);
  const [orderProductError, setOrderProductError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const processedComposeKey = useRef<string | null>(null);
  const shouldFocusComposer = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  const loadConversations = useCallback(
    async (options?: { preserveActive?: boolean }) => {
      if (!token) return;

      setIsLoadingList(true);
      setError(null);

      try {
        const nextConversations = await messagingService.listConversations(token, {
          limit: 20,
        });

        setConversations((current) => {
          if (nextConversations.length === 0 && current.length > 0) {
            return current;
          }

          return nextConversations;
        });
        setActiveConversationId((current) => {
          if (options?.preserveActive && current) return current;
          if (current && nextConversations.some((conversation) => conversation.id === current)) {
            return current;
          }
          if (current && nextConversations.length === 0) {
            return current;
          }
          return nextConversations[0]?.id ?? null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load conversations");
      } finally {
        setIsLoadingList(false);
      }
    },
    [token],
  );

  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return;

      setIsLoadingThread(true);
      setError(null);

      try {
        const nextDetail = await messagingService.getConversation(token, conversationId);
        setDetail(nextDetail);
      } catch (err) {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Unable to load conversation");
      } finally {
        setIsLoadingThread(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!isCreateOrderOpen || !token || !authUser?._id || !canCreateOrder) {
      return;
    }

    setIsLoadingOrderProducts(true);
    setOrderProductError(null);

    void productService
      .fetchMyProducts(authUser._id, token)
      .then((response) => {
        setOrderProducts(response.data.docs ?? []);
      })
      .catch((err) => {
        setOrderProducts([]);
        setOrderProductError(
          err instanceof Error ? err.message : "Unable to load catalogue products",
        );
      })
      .finally(() => {
        setIsLoadingOrderProducts(false);
      });
  }, [authUser?._id, canCreateOrder, isCreateOrderOpen, token]);

  useEffect(() => {
    if (!token) return;

    const intervalId = window.setInterval(() => {
      void loadConversations({ preserveActive: true });
      if (activeConversationId) {
        void loadConversation(activeConversationId);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [activeConversationId, loadConversation, loadConversations, token]);

  useEffect(() => {
    if (!activeConversationId) {
      setDetail(null);
      return;
    }

    void loadConversation(activeConversationId);
  }, [activeConversationId, loadConversation]);

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

    void messagingService
      .startConversation(token, { receiverId })
      .then((conversation) => {
        setConversations((current) => {
          const withoutDuplicate = current.filter((item) => item.id !== conversation.id);
          return [conversation, ...withoutDuplicate];
        });
        setComposeError(null);
        shouldFocusComposer.current = true;
        setActiveConversationId(conversation.id);
      })
      .catch((err) => {
        const fallbackConversationId = activeConversationId ?? conversations[0]?.id ?? null;
        setActiveConversationId(fallbackConversationId);
        setComposeError(
          fallbackConversationId
            ? null
            : err instanceof Error
              ? err.message
              : "Conversation could not be started.",
        );
        router.replace(pathname, { scroll: false });
      });
  }, [activeConversationId, conversations, pathname, router, searchParams, token]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();
    if (!token || !activeConversationId || !text || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await messagingService.sendMessage(token, {
        conversationId: activeConversationId,
        text,
      });
      setDraft("");
      await Promise.all([
        loadConversation(activeConversationId),
        loadConversations({ preserveActive: true }),
      ]);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    } finally {
      setIsSending(false);
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
        <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-[#E7ECF3] md:border-b-0 md:border-r">
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

            <div className="max-h-[620px] overflow-y-auto" data-testid="conversation-list">
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

          <div className="flex min-h-[620px] flex-col" data-testid="thread-view">
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

                <div className="flex-1 space-y-4 overflow-y-auto bg-white p-5">
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
                      onClick={() => setIsCreateOrderOpen(true)}
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
        />
      ) : null}
    </section>
  );
}
