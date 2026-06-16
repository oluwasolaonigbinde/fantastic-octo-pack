"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Avatar, AvatarImage, AvatarFallback } from "@/components/base";
import { ArrowRight } from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const navlinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/service-engineers", label: "Service Engineers" },
  { href: "/finances", label: "Finances" },
  { href: "/logistics", label: "Logistics" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const { data } = useAppSelector((state) => state.auth);

  const isLoggedIn = Boolean(data);
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-card border-b border-gray5 shadow-sm sticky top-0 z-50">
      {/* Main top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/images/Logo.png"
              alt="MedProcure Logo"
              width={120}
              height={40}
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden min-[970px]:flex gap-2 md:gap-6 items-center text-gray-800">
            {navlinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`md:text-sm xl:text-md transition ${
                  isActive(href)
                    ? "text-[#0669D9] font-medium"
                    : "hover:text-[#FE6E00]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop: Join Now */}
          <Button
            onClick={() => router.push("/login")}
            title="Join Now"
            variant="secondary"
            size="sm"
            iconRight={<ArrowRight />}
            className="hidden min-[970px]:flex px-8 w-fit!"
          />

          {/* Mobile: Avatar icon button */}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="min-[970px]:hidden relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open account panel"
          >
            <Avatar className="size-10">
              <AvatarImage
                src={data?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                alt={isLoggedIn ? `${data?.firstName || "User"}` : "Guest"}
              />
              <AvatarFallback>
                <span className="type-label-sm text-primary">
                  {data?.firstName?.split("")[0] || "G"}
                </span>
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      {/* Mobile horizontal nav strip */}
      <div className="min-[970px]:hidden border-t border-gray5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 px-4 h-10 w-max">
          {navlinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 text-sm whitespace-nowrap pb-0.5 transition ${
                isActive(href)
                  ? "text-[#FE6E00] font-semibold border-b-2 border-[#FE6E00]"
                  : "text-gray2 hover:text-[#FE6E00]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Account panel (left-side sheet, mobile only) */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="left"
          className="w-[min(82vw,260px)] !max-w-[260px] bg-white p-0"
        >
          <SheetHeader className="hidden">
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>

          {/* User / guest header */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-gray5">
            <Avatar className="size-10 shrink-0">
              <AvatarImage
                src={data?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                alt={isLoggedIn ? `${data?.firstName || "User"}` : "Guest"}
              />
              <AvatarFallback>
                <span className="type-label-sm text-primary">
                  {data?.firstName?.split("")[0] || "G"}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {isLoggedIn ? (
                <>
                  <p className="text-sm font-semibold text-gray1 truncate leading-tight">
                    {data?.firstName} {data?.lastName}
                  </p>
                  <p className="text-xs text-gray3 truncate leading-tight">
                    {data?.email}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray1 leading-tight">
                    Welcome
                  </p>
                  <p className="text-xs text-gray3 leading-tight">
                    Sign in to get started
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Panel body */}
          <div className="p-4 space-y-3">
            {isLoggedIn ? (
              <Button
                title="Go to Dashboard"
                variant="secondary"
                size="sm"
                iconRight={<ArrowRight />}
                onClick={() => {
                  router.push(`/dashboard/${data?.role}`);
                  setPanelOpen(false);
                }}
                className="w-full"
              />
            ) : (
              <>
                <Button
                  title="Sign In"
                  variant="secondary"
                  size="sm"
                  iconRight={<ArrowRight />}
                  onClick={() => {
                    router.push("/login");
                    setPanelOpen(false);
                  }}
                  className="w-full"
                />
                <Button
                  title="Create Account"
                  variant="secondaryLight"
                  size="sm"
                  onClick={() => {
                    router.push("/register");
                    setPanelOpen(false);
                  }}
                  className="w-full"
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
