"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ExternalLink, LogOut } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { logout } from "@/store/slices/auth-slice";
import { Button } from "@/components/base";

export interface DashboardLink {
  id?: number;
  name: string;
  path: string;
  icon?: React.ReactNode;
  iconActive?: React.ReactNode;
  disabled?: boolean;
}

interface DashboardSidebarProps {
  logo: string;
  baseUrl: string;
  links: DashboardLink[];
  textColor?: string;
  linkClass?: "light" | "dark" | "lightBordered" | "darkBordered";
  background?: "plain" | "primary";
  showBackToWebsite?: boolean;
  showLogout?: boolean;
  /** When set, replaces the default plain/primary surface for the sidebar shell and nav scroller. */
  surfaceClassName?: string;
  /** Optional nav top padding override for role-specific shells. */
  navClassName?: string;
}

interface BackToWebsiteLinkProps {
  className?: string;
  variant?: "light" | "dark";
  onClick?: () => void;
}

export function BackToWebsiteLink({
  className = "",
  variant = "light",
  onClick,
}: BackToWebsiteLinkProps) {
  const toneClass =
    variant === "dark"
      ? "text-[#EAF9FF] hover:bg-[#EAF9FF]/10 focus-visible:outline-[#EAF9FF]"
      : "text-primary-dark hover:bg-primary-light focus-visible:outline-primary-dark";

  return (
    <Link
      href="/"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition ${toneClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      <span>Back to website</span>
      <ExternalLink className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export default function DashboardSidebar({
  logo,
  baseUrl,
  background = "plain",
  linkClass = "light",
  textColor,
  links,
  showBackToWebsite = true,
  showLogout = true,
  surfaceClassName,
  navClassName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const isNavActive = (href: string, isDashboardRoot: boolean) => {
    if (isDashboardRoot) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const bgClasses = {
    plain: "bg-white",
    primary: "bg-primary-dark",
  }[background];

  const surfaceClass = surfaceClassName ?? bgClasses;

  const linkStyle = {
    light:
      "hover:translate-x-2 text-gray1 transition-all duration-500 hover:text-primary-dark",
    lightBordered:
      "text-gray1 hover:translate-x-2 transition-all duration-500 hover:text-primary-dark hover:border-primary-dark",
    dark:
      "group-hover:translate-x-2 transition-all duration-500 text-primary-light group-hover:text-primary-dark",
    darkBordered:
      `hover:translate-x-2 ${textColor ?? "text-primary-dark"} transition-all duration-500 hover:border-primary-light`,
  }[linkClass];

  const activeClass = {
    light: "bg-primary-light text-primary-dark",
    lightBordered: "border-primary-dark",
    dark: "bg-primary-light text-primary-dark",
    darkBordered: "bg-primary-dark text-primary-light",
  }[linkClass];

  const borderClass = {
    light: "",
    lightBordered: "border-primary-dark",
    dark: "",
    darkBordered: "border-primary-dark",
  }[linkClass];

  const dotClass = {
    plain: "bg-primary-dark",
    primary: "bg-[#EAF9FF]",
  }[background];
  const deferredButtonClass = surfaceClassName
    ? "border-[#D4E8FC] bg-[#F0F8FF] text-gray3"
    : {
        plain: "border-gray5 bg-white text-gray3",
        primary: "border-primary-light/15 bg-primary-dark/40 text-primary-light/70",
      }[background];

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <aside
      className={`sticky h-full flex flex-col justify-between top-0 ${surfaceClass}`}
    >
      <div className="mb-4">
        <div
          className={`h-[100px] flex flex-col items-start justify-center gap-1 pl-8 border-b ${
            linkClass === "dark"
              ? "border-[#0D53A3]"
              : surfaceClassName
              ? "border-[#D4E8FC]"
              : "border-gray5"
          }`}
        >
          <Link href="/">
            <Image
              src={logo}
              alt="MedProcure logo"
              width={112}
              height={43}
              priority
              unoptimized
              className="h-auto w-auto"
            />
          </Link>
          {showBackToWebsite ? (
            <BackToWebsiteLink variant={linkClass === "dark" ? "dark" : "light"} />
          ) : null}
        </div>
        <div
          className={`pb-8 ${navClassName ?? "h-[70vh] pt-11 space-y-5"} ${surfaceClass} overflow-y-auto no-scrollbar`}
        >
          {links.map((link, index) => {
            const path =
              index === 0
                ? `/dashboard/${baseUrl}`
                : `/dashboard/${baseUrl}/${link.path}`;
            const isDeferredLink = Boolean(link.disabled);
            const isCurrentPath = isNavActive(path, index === 0);
            const linkContentClass =
              linkClass === "dark"
                ? isCurrentPath
                  ? "bg-[#EAF9FF] text-[#03265C]"
                  : "text-[#EAF9FF] group-hover:bg-[#EAF9FF] group-hover:text-[#03265C] group-hover:translate-x-2"
                : `${linkStyle} ${!isCurrentPath && textColor ? textColor : ""} ${
                    isCurrentPath ? activeClass : ""
                  }`;

            if (isDeferredLink) {
              return (
                <div
                  key={link.path}
                  className={`group flex items-center px-3 gap-2 ${borderClass}`}
                >
                  <span className={`invisible size-[8px] rounded-full ${dotClass}`} />
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className={`flex w-full items-center gap-2 rounded-2xl border py-3 px-3 text-left ${deferredButtonClass} ${
                        textColor ? textColor : ""
                      }`}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </button>
                  </div>
                );
            }

            return (
              <Link
                key={link.path}
                href={path}
                className={`group flex items-center px-3 gap-2 ${borderClass}`}
                style={{ borderRight: isCurrentPath ? "3px solid" : "none" }}
              >
                <span
                  className={`${
                    isCurrentPath ? "visible" : "invisible"
                  } group-hover:visible size-[8px] rounded-full ${dotClass}`}
                />
                <span
                  className={`flex gap-2 py-3 px-3 rounded-2xl ${
                    textColor ? textColor : ""
                  } w-full ${linkContentClass}`}
                >
                  {link.icon}
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {showLogout ? (
        <Button
          title="Logout"
          size="sm"
          onClick={handleLogout}
          iconLeft={<LogOut />}
          className="mx-auto mb-4 gap-6 !max-w-[150px] !bg-danger/80 !border-danger hover:!max-w-[200px] hover:!bg-danger hover:!text-white"
        />
      ) : null}
    </aside>
  );
}
