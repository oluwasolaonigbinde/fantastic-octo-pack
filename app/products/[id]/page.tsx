"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Star,
  StarHalf,
} from "lucide-react";

import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import ProductImageGallery from "./ProductImageGallery";
import ProductInfo from "./ProductInfo";
import RelatedProducts from "./RelatedProducts";
import ConfirmOrderModal from "./ConfirmOrderModal";
import EditDeliveryAddressModal from "./EditDeliveryAddressModal";
import SendInquiryModal from "./SendInquiryModal";
import { fetchProductById } from "@/store/slices/product-slice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import type { Product } from "@/types/product";
import type { UserData } from "@/types/user";
import { BigLoader } from "@/components/base";
import {
  getProductAvailabilityLabel,
  getProductDefaultImageUrl,
  getProductImageUrls,
  getProductSpecificationItems,
  getPrimaryProductLocation,
} from "@/utils/productDisplay";
import {
  clearPendingAuthIntent,
  readPendingAuthIntent,
  writePendingAuthIntent,
} from "@/utils/pendingAuth";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";
import productService from "@/services/productService";
import orderService from "@/services/orderService";
import addressService from "@/services/addressService";
import type { AddAddressPayload, UserAddress } from "@/types/address";

const DEFAULT_WARRANTY_ITEMS = [
  "Cover first 1-year repair/replacement of defect.",
  "Installation included.",
  "Service Engineer assigned seller.",
  "Terms vary per provider and seller service agreement.",
];

const DEFAULT_LOGISTICS_ITEMS = [
  "Shipping handled directly by the seller.",
  "Customs clearance support available on request.",
  "Bulk delivery timelines depend on destination and stock readiness.",
];
const ORDER_NOW_RESUME_ACTION = "order_now";

function splitDetailText(value: string | undefined, fallback: string[]): string[] {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }

  const items = normalized
    .split(/\r?\n|[.;](?=\s|$)/)
    .map((item) => item.replace(/^[*-]\s*/, "").trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function getStoreAddress(user?: UserData | null): string {
  const profile = user?.distributorStoreProfile;

  return [
    profile?.address,
    profile?.city,
    profile?.state,
    profile?.country,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

function resolveDeliveryAddress(
  user: UserData | null | undefined,
  fallbackLocation: string,
): string {
  return (
    user?.address?.trim() ||
    getStoreAddress(user) ||
    fallbackLocation ||
    "Delivery address not specified"
  );
}

function buildOrderPaymentHref(role: string | undefined, orderId: string): string {
  if (role === "buyer") {
    // Payment stays on the main website. The dashboard order page keeps its own
    // "Make payment" entry point for orders left in a pending state.
    return `/checkout/${orderId}`;
  }

  if (role === "distributor") {
    return `/dashboard/distributor/orders/${orderId}`;
  }

  if (role === "engineer") {
    return "/dashboard/engineer/wallet";
  }

  return "/dashboard";
}

function RatingStars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) {
          return (
            <Star
              key={index}
              size={size}
              className="fill-[#FDB022] text-[#FDB022]"
            />
          );
        }

        if (index === fullStars && hasHalfStar) {
          return (
            <StarHalf
              key={index}
              size={size}
              className="fill-[#FDB022] text-[#FDB022]"
            />
          );
        }

        return <Star key={index} size={size} className="text-[#D0D5DD]" />;
      })}
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const { product, message, isLoading, isError } = useAppSelector(
    (state) => state.product,
  );
  const { data: authData } = useAppSelector((state) => state.auth);
  const authRole = authData?.role;
  const authAccessToken = authData?.tokens?.accessToken;

  const [isOrdering, setIsOrdering] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [showWarrantyDetails, setShowWarrantyDetails] = useState(false);
  const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState(false);
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const processedResumeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    let isMounted = true;

    async function loadRelatedProducts() {
      if (!product?.category) {
        if (isMounted) {
          setRelatedProducts([]);
        }
        return;
      }

      setIsRelatedLoading(true);

      try {
        const result = await productService.fetchWithFilter({
          category: product.category,
          populate: "createdBy",
          limit: 16,
        });

        if (!isMounted) {
          return;
        }

        const nextProducts = (result.data.docs ?? [])
          .filter((item) => item._id !== product._id)
          .slice(0, 12);
        setRelatedProducts(nextProducts);
      } catch {
        if (isMounted) {
          setRelatedProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsRelatedLoading(false);
        }
      }
    }

    void loadRelatedProducts();

    return () => {
      isMounted = false;
    };
  }, [product?._id, product?.category]);

  const createdBy = useMemo(
    () =>
      product?.createdBy && typeof product.createdBy === "object"
        ? (product.createdBy as UserData)
        : null,
    [product?.createdBy],
  );

  const sellerName =
    `${createdBy?.firstName ?? ""} ${createdBy?.lastName ?? ""}`.trim() || "Seller";
  const sellerId =
    createdBy?._id ??
    (typeof product?.createdBy === "string" ? product.createdBy : undefined);
  const sellerAvatar = createdBy?.displayPhoto?.url ?? "/images/profile.png";
  const sellerLocation =
    createdBy?.address?.trim() ||
    getPrimaryProductLocation(product) ||
    "Location not specified";
  const sellerRating = createdBy?.rating ?? 0;
  const sellerProfileHref = sellerId
    ? `/distributor/profile?id=${sellerId}`
    : "/distributor";
  const defaultDeliveryAddress = useMemo(
    () => resolveDeliveryAddress(authData, sellerLocation),
    [authData, sellerLocation],
  );

  const specificationItems = useMemo(
    () => getProductSpecificationItems(product).slice(0, 9),
    [product],
  );

  const warrantyItems = useMemo(
    () => splitDetailText(product?.return_policy, DEFAULT_WARRANTY_ITEMS),
    [product?.return_policy],
  );

  const logisticsItems = useMemo(() => {
    const productSpecificItems = [
      `Shipping from ${sellerLocation}.`,
      product?.delivery_time ? `Delivery window: ${product.delivery_time}.` : "",
      product?.installation_time
        ? `Installation timeline: ${product.installation_time}.`
        : "",
    ].filter(Boolean);

    return productSpecificItems.length > 0
      ? productSpecificItems
      : DEFAULT_LOGISTICS_ITEMS;
  }, [product?.delivery_time, product?.installation_time, sellerLocation]);

  const productOverviewText =
    product?.description?.trim() ||
    "Product overview will appear here once the seller provides a detailed description for buyers.";

  const persistPendingAuthIntent = useCallback(
    (action: "send_inquiry" | "order_now") => {
      writePendingAuthIntent({
        sourcePath: `/products/${id}`,
        action,
        productId: id,
        productName: product?.name,
        sellerId,
      });
    },
    [id, product?.name, sellerId],
  );

  const applyAddressList = useCallback(
    (list: UserAddress[], preferId?: string) => {
      setAddresses(list);
      setSelectedAddressId((current) => {
        const preferred = preferId && list.some((a) => a._id === preferId)
          ? preferId
          : "";
        const stillValid = list.some((a) => a._id === current) ? current : "";
        return (
          preferred ||
          stillValid ||
          list.find((a) => a.isDefault)?._id ||
          list[0]?._id ||
          ""
        );
      });
    },
    [],
  );

  const loadAddresses = useCallback(async () => {
    const token = authData?.tokens?.accessToken;
    if (!token) {
      return;
    }

    try {
      const result = await addressService.fetchAddresses(token);
      if (result.success) {
        applyAddressList(result.data ?? []);
      }
    } catch {
      // The dialog still works with the profile fallback address.
    }
  }, [applyAddressList, authData?.tokens?.accessToken]);

  const handleAddAddress = useCallback(
    async (payload: AddAddressPayload) => {
      const token = authData?.tokens?.accessToken;
      if (!token) {
        return;
      }

      setIsSavingAddress(true);
      try {
        const result = await addressService.addAddress(token, payload);
        if (result.success) {
          const list = result.data ?? [];
          // Select the address we just added (match on its fields).
          const added = [...list]
            .reverse()
            .find(
              (a) =>
                a.address === payload.address &&
                a.city === payload.city &&
                a.state === payload.state,
            );
          applyAddressList(list, added?._id);
        }
      } finally {
        setIsSavingAddress(false);
      }
    },
    [applyAddressList, authData?.tokens?.accessToken],
  );

  const handleSendInquiry = useCallback(() => {
    setIsInquiryOpen(true);
  }, []);

  const handleOrderNow = useCallback(async () => {
    if (!authData) {
      persistPendingAuthIntent("order_now");
      router.push("/register");
      return;
    }

    if (!product || !sellerId || !authData.tokens?.accessToken) {
      return;
    }

    setOrderQuantity(1);
    setDeliveryAddress((currentAddress) => currentAddress || defaultDeliveryAddress);
    setIsConfirmOrderOpen(true);
    void loadAddresses();
  }, [
    authData,
    defaultDeliveryAddress,
    loadAddresses,
    persistPendingAuthIntent,
    product,
    router,
    sellerId,
  ]);

  const handleMakePayment = useCallback(async () => {
    if (!authData || !product || !sellerId || !authData.tokens?.accessToken) {
      return;
    }

    setIsOrdering(true);

    try {
      const result = await orderService.createDirectOrder(
        authData.tokens.accessToken,
        {
          product: product._id,
          productName: product.name,
          quantity: orderQuantity,
          seller: sellerId,
          totalPrice: (product.pricePerUnit || 0) * orderQuantity,
          // Omit to let the backend fall back to the buyer's default address.
          addressId: selectedAddressId || undefined,
        },
      );

      if (result.success && result.data) {
        setIsConfirmOrderOpen(false);
        router.push(buildOrderPaymentHref(authData.role, result.data._id));
      }
    } catch {
      // Toast feedback is not wired here yet.
    } finally {
      setIsOrdering(false);
    }
  }, [
    authData,
    orderQuantity,
    product,
    router,
    selectedAddressId,
    sellerId,
  ]);

  const handleMessageSeller = useCallback(() => {
    if (!sellerId) {
      return;
    }

    if (!authAccessToken) {
      writePendingAuthIntent({
        action: "send_message",
        sourcePath: `/products/${id}`,
        receiverId: sellerId,
      });
      router.push("/login");
      return;
    }

    const composeHref = buildMessagingComposeHref(authRole, sellerId);

    if (!composeHref) {
      clearPendingAuthIntent();
      router.push("/dashboard");
      return;
    }

    router.push(composeHref);
  }, [authAccessToken, authRole, id, router, sellerId]);

  useEffect(() => {
    const resumeAction = searchParams.get("resumeAction");

    if (resumeAction !== ORDER_NOW_RESUME_ACTION) {
      return;
    }

    if (!authData) {
      return;
    }

    if (!product || !sellerId || !authData.tokens?.accessToken) {
      return;
    }

    const resumeAccessToken = authData.tokens.accessToken;
    const resumeKey = [
      resumeAction,
      id,
      sellerId,
      authData._id ?? "",
      resumeAccessToken ? "token" : "no-token",
    ].join(":");

    if (processedResumeKeyRef.current === resumeKey) {
      return;
    }

    const pendingAuthIntent = readPendingAuthIntent();

    if (
      !pendingAuthIntent ||
      pendingAuthIntent.action !== ORDER_NOW_RESUME_ACTION ||
      pendingAuthIntent.productId !== id
    ) {
      processedResumeKeyRef.current = resumeKey;
      router.replace(`/products/${id}`);
      return;
    }

    processedResumeKeyRef.current = resumeKey;
    clearPendingAuthIntent();
    router.replace(`/products/${id}`);
    const openConfirmTimer = window.setTimeout(() => {
      setOrderQuantity(1);
      setDeliveryAddress((currentAddress) => currentAddress || defaultDeliveryAddress);
      setIsConfirmOrderOpen(true);
      void loadAddresses();
    }, 0);

    return () => window.clearTimeout(openConfirmTimer);
  }, [
    authData,
    defaultDeliveryAddress,
    id,
    loadAddresses,
    product,
    router,
    searchParams,
    sellerId,
  ]);

  if (isLoading && !product) {
    return (
      <PublicLayout contentClassName="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <BigLoader />
        </div>
      </PublicLayout>
    );
  }

  if (isError && !product) {
    return (
      <PublicLayout contentClassName="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-danger/80">Error</h1>
            <p className="mt-2 text-gray3">
              {message || "Failed to load product."}
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout contentClassName="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-700">Product Not Found</h1>
            <p className="mt-2 text-gray-500">
              The product you are looking for does not exist.
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      banner={
        <Banner
          title="Product Details"
          breadcrumbs={[
            { label: "Category", href: "/products" },
            { label: product.category || "Equipment", href: "/products" },
            { label: product.name || "Product" },
          ]}
        />
      }
      contentClassName="min-h-screen flex flex-col bg-white"
    >
      <div className="flex-1 bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-14 min-[1500px]:px-0">
        <div className="mx-auto max-w-[1420px] space-y-8 lg:space-y-12">
          <div className="grid gap-8 lg:grid-cols-[500px_minmax(0,1fr)] lg:items-stretch">
            <ProductImageGallery
              mainImage={getProductDefaultImageUrl(product)}
              thumbnails={getProductImageUrls(product)}
              title={product.name}
            />

            <ProductInfo
              title={product.name}
              availabilityLabel={getProductAvailabilityLabel(product)}
              price={product.pricePerUnit || 0}
              isSellerVerified={Boolean(createdBy?.isEmailVerified)}
              isOemVerified={product.oemApprovalStatus === "approved"}
              onSendInquiry={handleSendInquiry}
              onOrderNow={handleOrderNow}
              onMessageSeller={handleMessageSeller}
            />
          </div>

          <div className="h-auto rounded-xl border border-[#F3F4F6] bg-[rgba(249,250,251,0.5)] px-5 py-4 lg:h-[90px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={sellerAvatar}
                  alt={sellerName}
                  width={56}
                  height={56}
                  className="size-11 rounded-full object-cover md:size-14"
                />
                <div>
                  <p className="text-base font-semibold leading-6 text-[#4B5563] md:text-xl">{sellerName}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563] md:text-base">
                    <RatingStars rating={sellerRating} size={14} />
                    <span>{sellerRating.toFixed(1)}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#4B5563]" />
                      {sellerLocation}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={sellerProfileHref}
                className="inline-flex h-9 items-center gap-1.5 self-start rounded-xl border border-[#F3F4F6] bg-white px-3 text-sm font-semibold text-[#4B5563] transition hover:text-[#0669D9] sm:self-auto md:h-10 md:text-base"
              >
                View Profile
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-8 text-[#111827] md:text-2xl md:leading-9">
              Product Overview
            </h2>
            <p className="max-w-[1199px] text-sm leading-7 text-[#4B5563] md:text-base md:leading-8">
              {productOverviewText}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold leading-8 text-[#111827] md:text-2xl md:leading-9">
              Key Specifications
            </h2>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.46fr)_minmax(280px,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1.46fr)_minmax(420px,1fr)]">
              <div className="overflow-hidden rounded-xl border border-[#DDE0E5] bg-white">
                <div className="grid grid-cols-[1fr_1fr] bg-[#EEF0F4] text-sm font-semibold text-[#4B5563] md:text-base">
                  <div className="border-r border-[#DDE0E5] px-4 py-2.5">
                    Specifications
                  </div>
                  <div className="px-4 py-2.5">Details</div>
                </div>

                {specificationItems.length > 0 ? (
                  specificationItems.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="grid grid-cols-[1fr_1fr] text-sm font-medium text-[#4B5563] md:text-base"
                    >
                      <div className="border-r border-t border-[#DDE0E5] bg-[#F8F8FA] px-4 py-2.5">
                        {item.label}
                      </div>
                      <div className="border-t border-[#DDE0E5] bg-[#FEFDFE] px-4 py-2.5">
                        {item.value || "--"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-[#4B5563] md:text-base">
                    Key specifications have not been added for this product yet.
                  </div>
                )}
              </div>

              <div className="space-y-4 lg:pt-0">
                <section className="rounded-xl border border-[#DDE0E5] bg-[rgba(249,250,251,0.5)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={sellerAvatar}
                        alt={sellerName}
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover"
                      />
                      <p className="truncate text-sm font-semibold text-[#4B5563]">
                        No review yet {sellerRating.toFixed(1)}/5
                      </p>
                    </div>
                    <Link
                      href={sellerProfileHref}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[rgba(220,234,248,0.4)] px-3 text-xs font-medium text-[#017BED]"
                    >
                      View Profile
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </section>

                <section className="rounded-xl border border-[#DDE0E5] bg-[#FEFDFE] p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#4B5563]">
                        {sellerRating.toFixed(1)}/5
                      </p>
                      <RatingStars rating={sellerRating} size={14} />
                    </div>
                    <p className="text-sm font-medium text-[#4B5563]">
                      No review yet
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      Only verified buyers can leave a review
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMessageSeller}
                    className="mt-3 h-9 rounded-xl bg-[#FAA12F] px-4 text-sm font-medium text-white"
                  >
                    Contact Seller
                  </button>
                </section>
              </div>
            </div>
          </section>

          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.46fr)_minmax(280px,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.46fr)_minmax(420px,1fr)]">
            <section className="flex flex-col space-y-3">
              <h2 className="text-xl font-semibold leading-8 text-[#111827] md:text-2xl md:leading-9">
                Warranty &amp; service sales
              </h2>
              <div className="flex flex-1 flex-col rounded-xl border border-[#DDE0E5] bg-[#FEFDFE] p-4">
                <ul className="space-y-2 text-sm leading-6 text-[#667085]">
                  {warrantyItems
                    .slice(0, showWarrantyDetails ? warrantyItems.length : 4)
                    .map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#98A2B3]" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWarrantyDetails((value) => !value)}
                    className="rounded-md border border-[#D7E8FF] bg-[#EFF6FF] px-3 py-1.5 text-xs font-medium text-[#0669D9] transition hover:bg-[#E1EEFF]"
                  >
                    {showWarrantyDetails ? "Hide warranty policy" : "View warranty policy"}
                  </button>
                  <Link
                    href="/service-engineers"
                    className="rounded-md border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#475467] transition hover:border-[#D0D5DD] hover:text-[#1D2939]"
                  >
                    Request Engineer
                  </Link>
                </div>
              </div>
            </section>

            <section className="flex flex-col space-y-3">
              <h2 className="text-xl font-semibold leading-8 text-[#111827] md:text-2xl md:leading-9">
                Logistics &amp; Delivery
              </h2>
              <div className="flex flex-1 flex-col rounded-xl border border-[#DDE0E5] bg-[#FEFDFE] p-4">
                <ul className="space-y-2 text-sm leading-6 text-[#667085]">
                  {logisticsItems.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
                <Link
                  href="/logistics"
                  className="mt-auto inline-flex w-fit items-center gap-1 rounded-md border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#475467] transition hover:border-[#D0D5DD] hover:text-[#1D2939]"
                >
                  Ask about logistics
                  <ChevronRight size={14} />
                </Link>
              </div>
            </section>
          </div>

          <RelatedProducts
            products={relatedProducts}
            isLoading={isRelatedLoading}
          />
        </div>
      </div>

      <SendInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />

      <ConfirmOrderModal
        isOpen={isConfirmOrderOpen}
        productName={product.name}
        productImage={getProductDefaultImageUrl(product)}
        sellerName={sellerName}
        unitPrice={product.pricePerUnit || 0}
        quantity={orderQuantity}
        isSubmitting={isOrdering}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        isSavingAddress={isSavingAddress}
        onClose={() => setIsConfirmOrderOpen(false)}
        onIncrement={() => setOrderQuantity((quantity) => quantity + 1)}
        onDecrement={() =>
          setOrderQuantity((quantity) => Math.max(1, quantity - 1))
        }
        onSelectAddress={(addressId) => setSelectedAddressId(addressId)}
        onAddAddress={handleAddAddress}
        onMakePayment={handleMakePayment}
      />

      <EditDeliveryAddressModal
        isOpen={isAddressEditorOpen}
        initialAddress={deliveryAddress || defaultDeliveryAddress}
        onClose={() => setIsAddressEditorOpen(false)}
        onSave={(address) => {
          setDeliveryAddress(address);
          setIsAddressEditorOpen(false);
        }}
      />

      {isOrdering && !isConfirmOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center gap-3">
              <BigLoader />
              <p className="text-sm text-[#475467]">Creating your order...</p>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
