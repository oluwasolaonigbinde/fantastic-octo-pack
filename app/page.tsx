"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ClipboardCheck,
  HandCoins,
  MapPin,
  MoveRightIcon,
  TextSearch,
  Truck,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product, ProductImage } from "@/types/product";
import { PublicLayout } from "@/components/layout";
import SafeProductImage from "@/components/product/SafeProductImage";
import { getProductAvailabilityLabel } from "@/utils/productDisplay";
import { useProductsQuery } from "@/hooks/queries/products";
import type { UserData } from "@/types/user";

type ProductWithDistributor = Omit<Product, "images"> & {
  distributor?: { businessName?: string };
  images?: Array<ProductImage | string>;
};

const LOCAL_PRODUCT_PLACEHOLDER_SRC = "/images/product 2.webp";
const FEATURED_PRODUCT_COUNT = 12;

const partnerLogos = [
  "/images/nhis_logo.png",
  "/images/pen_com_logo.png",
  "/images/ministry_of_work.png",
  "/images/firs_logo.png",
  "/images/nhis_logo.png",
  "/images/pen_com_logo.png",
  "/images/ministry_of_work.png",
];

const partnerLogoRows = [partnerLogos.slice(0, 5), partnerLogos.slice(5)];

const howItWorksSteps = [
  {
    id: 1,
    title: "Find Items",
    text: "Browse products directly or request what you need",
    Icon: TextSearch,
  },
  {
    id: 2,
    title: "Connect with Verified Suppliers",
    text: "Chat, request quotes, or engage suppliers instantly.",
    Icon: UserCheck,
  },
  {
    id: 3,
    title: "Create & Confirm Order",
    text: "Agree on details and generate a structured order.",
    Icon: ClipboardCheck,
  },
  {
    id: 4,
    title: "Pay Securely",
    text: "Use Baiy Trade assurance for protection, suppliers are only paid after delivery.",
    Icon: HandCoins,
  },
  {
    id: 5,
    title: "Delivery, Installation & Completion",
    text: "Track delivery, request a service engineer if needed and confirm completion.",
    Icon: Truck,
  },
];

const homeCategoryItems: Array<{
  id: string;
  title: string;
  image: string;
  query: string;
  products: string;
  distributors: string;
}> = [
  {
    id: "equipment",
    title: "Equipment",
    image: "/images/equipments1.png",
    query: "equipment",
    products: "320 products",
    distributors: "15 distributors",
  },
  {
    id: "consumables",
    title: "Consumables",
    image: "/images/main-equipments.png",
    query: "consumables",
    products: "1,520 products",
    distributors: "312 distributors",
  },
  {
    id: "instruments",
    title: "Instruments",
    image: "/images/equipment.png",
    query: "instruments",
    products: "320 products",
    distributors: "15 distributors",
  },
  {
    id: "accessories",
    title: "Accessories",
    image: "/images/equipments.png",
    query: "accessories",
    products: "450 products",
    distributors: "20 distributors",
  },
  {
    id: "spare-parts",
    title: "Spare parts",
    image: "/images/main-equipments.png",
    query: "spare parts",
    products: "180 products",
    distributors: "9 distributors",
  },
];

function resolveProductImage(images?: Array<ProductImage | string>) {
  const firstImage = images?.[0];
  const candidate =
    typeof firstImage === "string"
      ? firstImage
      : firstImage && typeof firstImage === "object" && "url" in firstImage
        ? firstImage.url
        : "";

  if (!candidate) {
    return LOCAL_PRODUCT_PLACEHOLDER_SRC;
  }

  if (candidate.includes("example.com")) {
    return LOCAL_PRODUCT_PLACEHOLDER_SRC;
  }

  return candidate;
}

function resolveDistributorName(product: ProductWithDistributor) {
  if (product.distributor?.businessName) {
    return product.distributor.businessName;
  }

  if (product.createdBy && typeof product.createdBy === "object") {
    const owner = product.createdBy as UserData;
    const fullName = [owner.firstName, owner.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fullName) {
      return fullName;
    }
  }

  return "Verified Distributor";
}

function formatProductPrice(product: ProductWithDistributor) {
  if (product.pricing_type === "rfq") {
    return "RFQ";
  }

  if (
    typeof product.pricePerUnit === "number" &&
    Number.isFinite(product.pricePerUnit)
  ) {
    return `N${product.pricePerUnit.toLocaleString()}`;
  }

  return "RFQ";
}

export default function Home() {
  const router = useRouter();
  const { data, isLoading, isError } = useProductsQuery({
    limit: FEATURED_PRODUCT_COUNT,
  });
  const products = data?.products ?? null;

  const featuredProducts =
    products
      ?.filter((item) => item.status === "approved")
      .slice(0, FEATURED_PRODUCT_COUNT) ?? [];

  return (
    <PublicLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-[1420px] px-4 pb-10 pt-6 sm:px-6 lg:px-16 lg:pb-12 lg:pt-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2.03fr)_minmax(300px,1fr)] lg:items-stretch">
            <div
              className="flex flex-col overflow-hidden rounded-[24px] bg-[#e8eeee] px-6 py-6 sm:px-8 lg:px-9 lg:py-8"
              data-testid="public-home-hero"
            >
              {/* Image on top on mobile, side by side on larger screens */}
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                {/* Image: on top + centered on mobile, bleeds to card edges on larger screens */}
                <div className="relative w-[60%] max-w-[260px] -mt-2 sm:order-2 sm:w-[40%] sm:max-w-[320px] sm:shrink-0 sm:-mr-8 sm:-mt-8 lg:max-w-[380px] lg:-mr-10 lg:-mt-10">
                  <Image
                    src="/images/Hero.png"
                    alt="Medical equipment hero visual"
                    width={420}
                    height={360}
                    priority
                    className="h-auto w-full object-contain"
                  />
                </div>

                {/* Text + buttons + badges */}
                <div className="flex w-full flex-1 min-w-0 flex-col text-center sm:order-1 sm:text-left">
                  <h1 className="font-['Urbanist',sans-serif] text-[1.35rem] font-medium leading-[1.2] tracking-[-0.02em] text-[#111827] sm:text-[1.55rem] lg:text-[1.9rem]">
                    The Trusted B2B Platform for{" "}
                    <strong className="font-bold">
                      Medical Equipment Procurement
                    </strong>{" "}
                    in Africa
                  </h1>

                  <p className="mt-3 font-['Urbanist',sans-serif] text-[0.85rem] leading-6 text-[#4b5563] sm:text-[0.9rem] sm:leading-6 lg:text-[0.95rem]">
                    Request quotes, compare verified suppliers, and pay safely
                    with Baiy Trade ASSURANCE
                  </p>

                  <div className="mt-6 flex flex-col items-center gap-3 sm:items-start lg:mt-8">
                    <div className="flex flex-nowrap items-center justify-center gap-2 sm:justify-start sm:gap-4">
                      <button
                        type="button"
                        onClick={() => router.push("/products")}
                        className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-[11px] bg-[#fe6e00] px-4 font-['Urbanist',sans-serif] text-sm font-semibold text-white transition hover:bg-[#e76200] sm:px-5 sm:text-base"
                      >
                        Request a Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/products")}
                        className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-[11px] border border-[rgba(107,114,128,0.12)] bg-white/40 px-4 font-['Urbanist',sans-serif] text-sm font-medium text-[#053782] backdrop-blur-sm transition hover:bg-white/60 sm:px-5 sm:text-base"
                      >
                        Browse Equipment
                      </button>
                    </div>
                    <div className="flex flex-nowrap items-center gap-5 lg:gap-10">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-['Urbanist',sans-serif] text-[0.75rem] font-normal text-[#4b5563] sm:text-sm">
                        <Image
                          src="/icons/verified-fill.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="shrink-0"
                        />
                        Verified Suppliers
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-['Urbanist',sans-serif] text-[0.75rem] font-normal text-[#4b5563] sm:text-sm">
                        <Image
                          src="/icons/escrow-protect.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="shrink-0"
                        />
                        Escrow Protection
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider + tagline */}
              <div className="mt-6 border-t border-[#c8d4d4] pt-4 lg:mt-7">
                <p className="font-['Urbanist',sans-serif] text-[0.95rem] font-medium tracking-[0.03em] text-[#111827] sm:text-[1.05rem] lg:text-[1.35rem] lg:leading-[1.4]">
                  BAIY AFRICA, THE NEW WAY TO BUY,
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] bg-[#faf2e9] px-5 py-5">
              <h2 className="font-['Urbanist',sans-serif] text-[1.3rem] font-medium leading-tight text-[#111827] sm:text-[1.6rem]">
                How Baiy Works
              </h2>

              <div className="mt-3 flex flex-1 flex-col gap-2">
                {howItWorksSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex gap-2.5 rounded-[12px] bg-[#fef9f6] px-3 py-2.5"
                  >
                    <div className="shrink-0">
                      <step.Icon
                        size={20}
                        className="text-[#0669d9]"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-['Urbanist',sans-serif] text-[0.9rem] font-semibold leading-snug text-[#111827]">
                        {step.title}
                      </p>
                      <p className="mt-0.5 font-['Urbanist',sans-serif] text-[0.75rem] font-normal leading-[1.35] text-[#4b5563]">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => router.push("/products")}
                className="mx-auto mt-3 flex flex-col items-center gap-0.5 font-['Urbanist',sans-serif] text-[0.8rem] font-medium text-[#0669d9] transition hover:text-[#0558b8]"
              >
                <span>See Less</span>
                <ChevronUp size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div
            className="mt-10 sm:mt-12"
            data-testid="public-home-category-strip"
          >
            <div className="text-center">
              <h2 className="font-['Urbanist',sans-serif] text-[1.75rem] font-medium leading-snug text-[#111827] sm:text-[2rem] lg:text-[2.35rem] lg:leading-[52px]">
                Build for{" "}
                <span className="font-semibold">Medical Procurement</span>
              </h2>
              <p className="mt-2 font-['Urbanist',sans-serif] text-base font-medium text-[#4b5563] sm:text-lg lg:text-[1.15rem] lg:leading-[1.4]">
                Exploring into Electronics, Solar &amp; Industrial Procurement
                soon.
              </p>
            </div>
            <div className="mt-8 grid w-full grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
              {homeCategoryItems.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/products?category=${encodeURIComponent(category.query)}`,
                    )
                  }
                  className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#dde0e5] bg-white text-left transition hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0669d9] sm:rounded-[16px] lg:aspect-268/187 lg:rounded-[24px] lg:p-5"
                >
                  <div className="relative h-[120px] w-full bg-[#f4f6f8] lg:absolute lg:left-[7.27%] lg:top-[10.43%] lg:h-[48.13%] lg:w-[38.81%] lg:rounded-[2.869px] lg:border-[0.239px] lg:border-[#f3f4f6] lg:bg-transparent">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 104px"
                      className="object-contain p-4 lg:p-0"
                    />
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 lg:absolute lg:left-[20px] lg:right-[20px] lg:top-[46.79%] lg:w-auto lg:gap-0 lg:bg-white/20 lg:px-0 lg:py-2 lg:backdrop-blur-md">
                    <p className="font-['Urbanist',sans-serif] text-[14px] font-semibold leading-[20px] text-[#111827] lg:whitespace-nowrap lg:text-[20px] lg:font-medium lg:leading-[32px] lg:text-black">
                      {category.title}
                    </p>
                    <div className="flex gap-0.5 font-['Urbanist',sans-serif] text-[12px] font-normal leading-[18px] text-[#4b5563] lg:whitespace-nowrap lg:gap-[6px] lg:text-[16px] lg:leading-[24px]">
                      <p>{category.products}</p>
                      <p>{category.distributors}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 pb-8 sm:py-10 sm:pb-10 lg:pb-[120px]">
        <div className="mx-auto max-w-[1420px] px-4 sm:px-6 lg:px-16">
          <h2 className="text-center font-['Urbanist',sans-serif] text-[2rem] font-black leading-tight text-[#4b5563] sm:text-[2.75rem] lg:text-[3.5rem] lg:leading-none">
            Verified Distributors &amp; OEMs
          </h2>

          <div className="mt-16 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
            <div className="flex w-full items-center justify-center gap-8 sm:grid sm:grid-cols-7 sm:justify-items-center sm:gap-x-12 sm:gap-y-8 lg:gap-x-[158px]">
              {partnerLogos.map((logo, index) => (
                <div
                  key={`${logo}-${index}`}
                  className="relative h-12 w-[72px] shrink-0 sm:h-14 sm:w-[86px]"
                >
                  <Image
                    src={logo}
                    alt={`Verified partner ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 72px, 86px"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d3478] py-14 text-white sm:py-18">
        <div className="mx-auto max-w-[1420px] px-4 sm:px-6 lg:px-16">
          <div className="text-center">
            <h2 className="font-family-montserrat text-[1.9rem] font-extrabold tracking-[-0.03em] text-white sm:text-[2.2rem]">
              Featured Products
            </h2>
            <p className="mx-auto mt-2 max-w-[430px] text-sm text-[#c5d4f3]">
              Top quality equipment and consumables that are BNPL eligible
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-[#d9e4fb]">
              Loading products...
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-[#ffd3d3]">
              Featured products are unavailable right now.
            </div>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {featuredProducts.map((item: ProductWithDistributor) => (
                  <button
                    key={item._id}
                    onClick={() => router.push(`/products/${item._id}`)}
                    className="flex flex-col overflow-hidden rounded-[18px] border border-[#dde0e5] bg-white text-left text-[#11203d] transition hover:-translate-y-1 hover:shadow-[0_18px_28px_rgba(5,23,59,0.18)] sm:rounded-[24px]"
                  >
                    <div className="relative h-[160px] w-full bg-[linear-gradient(180deg,#fdfdfe_39%,#e0e3e8_100%)] sm:h-[239px]">
                      <SafeProductImage
                        src={resolveProductImage(item.images)}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-contain p-3 sm:p-4"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-4 px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
                      <h3 className="line-clamp-2 font-['Urbanist',sans-serif] text-base font-medium leading-snug text-[#111827] sm:text-[20px] sm:leading-[28px]">
                        {item.name}
                      </h3>

                      <div className="flex flex-col gap-2">
                        <div className="flex min-w-0 flex-col gap-1.5 text-xs text-[#4b5563] sm:gap-2 sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2
                              size={14}
                              className="shrink-0 text-[#13A83B]"
                            />
                            <span className="truncate">
                              {getProductAvailabilityLabel(item)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 text-[#4b5563]"
                            />
                            <span className="truncate">
                              {item.manufacturing_country || "Nigeria"}
                            </span>
                          </div>
                        </div>
                        <div className="inline-flex w-fit rounded-lg bg-[rgba(254,110,0,0.06)] px-2 py-1 sm:px-2.5">
                          <p className="font-['Urbanist',sans-serif] text-base font-bold text-[#fe6e00] sm:text-[20px] sm:leading-[28px]">
                            {formatProductPrice(item)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3 pt-0 text-sm text-[#4b5563] sm:px-4 sm:pb-4 sm:text-[18px]">
                      <span>Condition: </span>
                      <span className="font-semibold capitalize text-[#111827]">
                        {item.condition || "New"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {!featuredProducts.length && (
                <div className="mt-8 rounded-[18px] border border-white/15 bg-white/6 px-6 py-10 text-center text-sm text-[#d9e4fb]">
                  Featured listings will appear here as approved marketplace
                  products become available.
                </div>
              )}

              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => router.push("/products")}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#cbe2ff] px-10 text-sm font-semibold text-[#0d3478] transition hover:bg-[#b8d6ff]"
                >
                  View More
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fef8f0_100%)] py-16 text-center sm:py-20">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-family-montserrat text-[2rem] font-extrabold leading-tight tracking-[-0.03em] text-[#13203d] sm:text-[2.45rem]">
            Ready to Benefit From our
            <br />
            Marketplace
          </h2>

          <p className="mx-auto mt-4 max-w-[560px] text-sm leading-7 text-[#66758f] sm:text-base">
            Source trusted medical equipment faster, compare supplier options
            with confidence, and bring your business onto a marketplace built
            for procurement across Africa.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/login")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0669d9] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(6,105,217,0.24)] transition hover:bg-[#055bc0]"
            >
              Request a Quote
              <MoveRightIcon size={16} />
            </button>
            <button
              onClick={() => router.push("/register")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#fe6e00] bg-white px-7 text-sm font-semibold text-[#fe6e00] transition hover:bg-[#fff5eb]"
            >
              Join as OEM / Distributor
              <MoveRightIcon size={16} />
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
