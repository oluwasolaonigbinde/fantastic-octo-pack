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
  LogOut,
  Store,
  UserCircle,
  Wallet,
} from "lucide-react";
import SearchAutocomplete from "@/components/features/search/SearchAutocomplete";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppSelector";
import { logout } from "@/store/slices/auth-slice";
import { UserRole } from "@/types/user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/base";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { MoreHorizontal, UserPlus, FilePlus } from "lucide-react";
import { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  Record<
    UserRole,
    {
      dashboard: string;
      wallet?: string;
      order?: string;
      sourcing?: string;
      store?: string;
    }
  >
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
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const addAccountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        addAccountRef.current &&
        !addAccountRef.current.contains(e.target as Node)
      ) {
        setAddAccountOpen(false);
      }
    }
    if (addAccountOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addAccountOpen]);
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
    ? (ROLE_ACCOUNT_PATHS[authRole] ?? {
        dashboard: `/dashboard/${authRole}`,
      })
    : { dashboard: "/dashboard" };
  const accountDisplayName =
    authUser?.distributorStoreProfile?.businessName ||
    [authUser?.firstName, authUser?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
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
  const mobileAccountItems =
    mounted && isAuthenticated
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
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#DDE0E5] bg-[#F9F8F4]">
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
            {mounted && isAuthenticated ? (
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

                    <div className="border-t border-[#E5E7EB] pt-3 mt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setAccountMenuOpen(false);
                          await dispatch(logout());
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-[15px] font-normal text-[#EF4444] transition hover:bg-[#FEF2F2]"
                      >
                        <LogOut
                          size={20}
                          strokeWidth={1.5}
                          className="shrink-0"
                        />
                        <span>Log out</span>
                      </button>
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

          {/* Mobile: avatar button */}
          <div className="min-[1100px]:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobilePanelOpen(true)}
              className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6E00]"
              aria-label="Open account panel"
            >
              <Avatar className="size-10">
                <AvatarImage
                  src={authUser?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                  alt={
                    mounted && isAuthenticated ? accountDisplayName : "Guest"
                  }
                />
                <AvatarFallback>
                  <span className="text-sm font-semibold text-[#0669D9]">
                    {authUser?.firstName?.charAt(0) || "G"}
                  </span>
                </AvatarFallback>
              </Avatar>
            </button>
          </div>

          {/* Mobile account panel (left-side sheet) */}
          <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
            <SheetContent
              side="left"
              hideClose
              className="w-[min(82vw,260px)] !max-w-[260px] bg-white p-0"
            >
              <SheetHeader className="hidden">
                <SheetTitle>Account</SheetTitle>
              </SheetHeader>

              {/* Header: avatar + name/email + three-dot */}
              <div className="flex items-center gap-3 px-4 py-5 border-b border-[#E5E7EB]">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage
                    src={authUser?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                    alt={
                      mounted && isAuthenticated ? accountDisplayName : "Guest"
                    }
                  />
                  <AvatarFallback>
                    <span className="text-sm font-semibold text-[#0669D9]">
                      {authUser?.firstName?.charAt(0) || "G"}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {mounted && isAuthenticated ? (
                    <>
                      <p className="text-sm font-semibold text-[#111827] truncate leading-tight">
                        {accountDisplayName}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate leading-tight">
                        {authUser?.email}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#111827] leading-tight">
                        Welcome
                      </p>
                      <p className="text-xs text-[#9CA3AF] leading-tight">
                        Sign in to get started
                      </p>
                    </>
                  )}
                </div>

                {/* Three-dot: Add New Account */}
                <div className="relative shrink-0" ref={addAccountRef}>
                  <button
                    type="button"
                    onClick={() => setAddAccountOpen((v) => !v)}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#F3F4F6] transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-5 text-[#6B7280]" />
                  </button>

                  {addAccountOpen && (
                    <div className="absolute right-0 top-10 z-50 w-[210px] bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-sm font-semibold text-[#111827]">
                          Add New Account
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          Select account to add
                        </p>
                      </div>
                      <div className="mx-4 border-t border-[#E5E7EB]" />
                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => setAddAccountOpen(false)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors"
                        >
                          <span className="mt-0.5 flex shrink-0 items-center justify-center size-7 rounded-full bg-[#EFF6FF]">
                            <UserPlus className="size-4 text-[#0669D9]" />
                          </span>
                          <div>
                            <p className="text-xs font-medium text-[#111827] leading-tight">
                              Add Existing Account
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] leading-tight mt-0.5">
                              Login to existing account and add it to your list.
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddAccountOpen(false)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] text-left transition-colors"
                        >
                          <span className="mt-0.5 flex shrink-0 items-center justify-center size-7 rounded-full bg-orange-50">
                            <FilePlus className="size-4 text-orange-500" />
                          </span>
                          <div>
                            <p className="text-xs font-medium text-[#111827] leading-tight">
                              Create A New Role
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] leading-tight mt-0.5">
                              Create a new role (e.g buyer, OEM...)
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-3 space-y-1">
                {mounted && isAuthenticated ? (
                  <>
                    {mobileAccountItems.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setMobilePanelOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4B5563] transition hover:bg-[#F8FAFC] ${
                          href === pathname ? "bg-[#F0F7FF] text-[#0669D9]" : ""
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
                    <div className="border-t border-[#E5E7EB] pt-2 mt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setMobilePanelOpen(false);
                          await dispatch(logout());
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#EF4444] transition hover:bg-[#FEF2F2]"
                      >
                        <LogOut
                          size={18}
                          strokeWidth={1.8}
                          className="shrink-0"
                        />
                        <span>Log out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobilePanelOpen(false);
                        router.push("/login");
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FE6E00] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#ef760d]"
                    >
                      Sign In
                      <ArrowRight size={16} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobilePanelOpen(false);
                        router.push(PUBLIC_SIGN_UP_PATH);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB]"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
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
