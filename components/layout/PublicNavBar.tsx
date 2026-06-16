"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  FileSearch2,
  ListChecks,
  Menu,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import SearchAutocomplete from "@/components/features/search/SearchAutocomplete";
import { useAppSelector } from "@/hooks/useAppSelector";
import { UserRole } from "@/types/user";

const NAV_LINKS_STANDARD = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/service-engineers", label: "Service Engineers" },
  { href: "/finances", label: "Finance" },
  { href: "/logistics", label: "Logistics" },
];

const NAV_LINKS_PRODUCTS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/service-engineers", label: "Service Engineers" },
  { href: "/finances", label: "Finance" },
  { href: "/logistics", label: "Logistics" },
];

const PUBLIC_SIGN_UP_PATH = "/register";

const ROLE_ACCOUNT_PATHS: Partial<
  Record<UserRole, { dashboard: string; wallet?: string; order?: string; sourcing?: string; store?: string }>
> = {
  [UserRole.BUYER]: {
    dashboard: "/dashboard/buyer",
    wallet: "/dashboard/buyer/payments",
    order: "/dashboard/buyer/orders",
  },
  [UserRole.DISTRIBUTOR]: {
    dashboard: "/dashboard/distributor",
    wallet: "/dashboard/distributor/payments",
    order: "/dashboard/distributor/orders",
    sourcing: "/dashboard/distributor/quotes",
    store: "/dashboard/distributor/store",
  },
  [UserRole.OEM]: {
    dashboard: "/dashboard/oem",
  },
  [UserRole.ENGINEER]: {
    dashboard: "/dashboard/engineer",
    wallet: "/dashboard/engineer/wallet",
  },
};

const normalizeRole = (role: unknown): UserRole | null => {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role.trim().toLowerCase() as UserRole;
  return Object.values(UserRole).includes(normalizedRole)
    ? normalizedRole
    : null;
};

export default function PublicNavBar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();

  const isProductsListing = pathname === "/products";
  const desktopNavLinks = isProductsListing
    ? NAV_LINKS_PRODUCTS
    : NAV_LINKS_STANDARD;
  const mobileNavLinks = NAV_LINKS_PRODUCTS;
  const isActive = (href: string) => pathname === href;
  const authUser = useAppSelector((state) => state.auth.data);
  const isAuthenticated = !!authUser && !!authUser.tokens?.accessToken;
  const authRole = normalizeRole(authUser?.role);
  const accountPaths = authRole
    ? ROLE_ACCOUNT_PATHS[authRole] ?? {
        dashboard: `/dashboard/${authRole}`,
      }
    : { dashboard: "/dashboard" };
  const accountDisplayName =
    authUser?.distributorStoreProfile?.businessName ||
    [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ").trim() ||
    "MedProcure";
  const accountDisplayLine = authUser?.email || "Join to access account tools";
  const authedMenuItems = [
    {
      label: "My Dashboard",
      href: accountPaths.dashboard,
      icon: UserCircle,
    },
    ...(accountPaths.wallet
      ? [
          {
            label: "Wallet",
            href: accountPaths.wallet,
            icon: Wallet,
          },
        ]
      : []),
    ...(accountPaths.order
      ? [
          {
            label: "Order",
            href: accountPaths.order,
            icon: ListChecks,
          },
        ]
      : []),
  ];
  const mobileAccountItems = isAuthenticated
    ? [
        {
          label: "My Dashboard",
          href: accountPaths.dashboard,
          icon: UserCircle,
        },
        ...(accountPaths.wallet
          ? [
              {
                label: "Wallet",
                href: accountPaths.wallet,
                icon: Wallet,
              },
            ]
          : []),
        ...(accountPaths.order
          ? [
              {
                label: "Order",
                href: accountPaths.order,
                icon: ListChecks,
              },
            ]
          : []),
        ...(accountPaths.sourcing
          ? [
              {
                label: "Sourcing & Quoting",
                href: accountPaths.sourcing,
                icon: FileSearch2,
              },
            ]
          : []),
        ...(accountPaths.store
          ? [
              {
                label: "Store",
                href: accountPaths.store,
                icon: Store,
              },
            ]
          : []),
      ]
    : [
        {
          label: "My Dashboard",
          href: PUBLIC_SIGN_UP_PATH,
          icon: UserCircle,
        },
        {
          label: "Wallet",
          href: PUBLIC_SIGN_UP_PATH,
          icon: Wallet,
        },
        {
          label: "Order",
          href: PUBLIC_SIGN_UP_PATH,
          icon: ListChecks,
        },
        {
          label: "Sourcing & Quoting",
          href: PUBLIC_SIGN_UP_PATH,
          icon: FileSearch2,
        },
        {
          label: "Store",
          href: PUBLIC_SIGN_UP_PATH,
          icon: Store,
        },
      ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#DDE0E5] bg-white">
      <div className="mx-auto max-w-[1420px] px-4 sm:px-6 min-[1100px]:px-0">
        <div className="flex h-[80px] items-center justify-between gap-6 min-[1100px]:h-[130px]">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/Logo.png"
              alt="MedProcure Logo"
              width={98}
              height={32}
              priority
              className="h-auto w-auto"
            />
          </Link>

          <div className="hidden min-[1100px]:flex items-center gap-7 font-['Urbanist',sans-serif]">
            {desktopNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-base leading-8 transition ${
                  isActive(href)
                    ? "text-[#0669D9] font-semibold"
                    : "text-[#111827] font-normal hover:text-[#fe6e00]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden min-[1100px]:flex flex-1 justify-end pr-3">
            <SearchAutocomplete
              className="w-full max-w-[260px]"
              placeholder="Search"
              showSubmitButton={false}
              scope="public-universal"
            />
          </div>

          <div className="hidden min-[1100px]:flex items-center gap-3">
            {isAuthenticated ? (
              <Popover.Root
                open={accountMenuOpen}
                onOpenChange={setAccountMenuOpen}
              >
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#F3F4F6] bg-[#F9FAFB] text-[#4B5563] transition hover:bg-[#F3F4F6]"
                    aria-label="Open account menu"
                  >
                    <UserCircle size={22} strokeWidth={1.5} />
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    align="end"
                    sideOffset={10}
                    className="z-50 w-[260px] rounded-[16px] border border-[#F3F4F6] bg-white p-5 shadow-[0_4px_24px_rgba(17,24,39,0.12)] outline-none"
                  >
                    <div className="pb-4">
                      <p className="truncate text-[22px] font-semibold leading-tight text-[#374151]">
                        {accountDisplayName}
                      </p>
                      <p className="mt-1 truncate text-[15px] font-normal text-[#9CA3AF]">
                        {accountDisplayLine}
                      </p>
                    </div>

                    <div className="border-t border-[#E5E7EB] pt-3 space-y-1">
                      {authedMenuItems.map(({ label, href, icon: Icon }) => (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-[15px] font-normal text-[#4B5563] transition hover:bg-[#F8FAFC]"
                        >
                          <Icon
                            size={20}
                            strokeWidth={1.5}
                            className="shrink-0 text-[#596273]"
                          />
                          <span>{label}</span>
                        </Link>
                      ))}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ) : (
              <button
                onClick={() => router.push(PUBLIC_SIGN_UP_PATH)}
                className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FE6E00] px-5 font-['Urbanist',sans-serif] text-base font-medium text-white transition hover:bg-[#ef760d]"
              >
                Join Now
              </button>
            )}
          </div>

          <div className="min-[1100px]:hidden flex items-center">
            <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label={
                    menuOpen ? "Close account menu" : "Open account menu"
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-[#111827] transition hover:bg-black/5"
                >
                  <Menu size={28} strokeWidth={2} />
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={10}
                  className="z-50 w-[256px] rounded-[8px] border border-[#EEF1F5] bg-white p-4 font-['Urbanist',sans-serif] shadow-[0_4px_12px_rgba(17,24,39,0.16)] outline-none"
                >
                  <div className="space-y-1">
                    {mobileAccountItems.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex min-h-[40px] w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-[15px] font-normal leading-5 text-[#4B5563] transition hover:bg-[#F8FAFC] ${
                          isAuthenticated && href === pathname
                            ? "border border-[#B8D7FF] bg-[#F8FBFF]"
                            : ""
                        }`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                          className="shrink-0 text-[#596273]"
                        />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>

                  {!isAuthenticated && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(PUBLIC_SIGN_UP_PATH);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE6E00] px-5 py-3 text-[15px] font-medium text-white transition hover:bg-[#ef760d]"
                      >
                        Join Now
                        <ArrowRight size={18} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        <div className="min-[1100px]:hidden overflow-x-auto border-t border-[#ECEFF3] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full items-center gap-4 py-2.5 font-['Urbanist',sans-serif]">
            {mobileNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`shrink-0 border-b-2 pb-1 text-[12px] leading-4 transition-colors ${
                  isActive(href)
                    ? "border-[#FE6E00] font-medium text-[#111827]"
                    : "border-transparent font-normal text-[#374151] hover:text-[#FE6E00]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
