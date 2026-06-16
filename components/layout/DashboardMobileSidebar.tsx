"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { logout } from "@/store/slices/auth-slice";
import { Button } from "@/components/base";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BackToWebsiteLink, type DashboardLink } from "./DashboardSidebar";

interface DashboardMobileSidebarProps {
  logo: string;
  baseUrl: string;
  open: boolean;
  onClose: () => void;
  textColor?: string;
  linkClass?: "light" | "dark" | "lightBordered" | "darkBordered";
  links: DashboardLink[];
  background?: "plain" | "primary";
  surfaceClassName?: string;
  showBackToWebsite?: boolean;
  showLogout?: boolean;
}

export default function DashboardMobileSidebar({
  logo,
  baseUrl,
  open,
  onClose,
  textColor,
  background = "plain",
  linkClass = "light",
  links,
  surfaceClassName,
  showBackToWebsite = true,
  showLogout = true,
}: DashboardMobileSidebarProps) {
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className={`w-[min(82vw,240px)] !max-w-[240px] ${surfaceClass}`}
      >
        <SheetHeader className="hidden">
          <SheetTitle>n</SheetTitle>
        </SheetHeader>
        <aside className="sticky top-0 ">
          <div
            className={`h-[100px] flex flex-col items-start justify-center gap-1 pl-6 border-b ${
              linkClass === "dark"
                ? "border-[#0D53A3]"
                : surfaceClassName
                ? "border-[#D4E8FC]"
                : "border-gray5"
            }`}
          >
            <Link href="/" onClick={onClose}>
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
              <BackToWebsiteLink
                variant={linkClass === "dark" ? "dark" : "light"}
                onClick={onClose}
              />
            ) : null}
          </div>
          <div className="h-fit py-8 overflow-y-auto space-y-2 w-full overflow-y-auto">
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
                    className={`group flex items-center px-3 gap-2 border-r border-transparent ${borderClass}`}
                  >
                    <span className={`invisible size-[8px] rounded-full ${dotClass}`} />
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-3 text-left ${deferredButtonClass}`}
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
                  onClick={onClose}
                  className={`group flex items-center px-3 gap-2 border-r border-transparent ${borderClass}`}
                >
                  <span
                    className={`${
                      isCurrentPath ? "visible" : "invisible"
                    } group-hover:visible size-[8px] rounded-full ${dotClass}`}
                  />
                  <span
                    className={`flex gap-2 py-3 px-3 rounded-2xl w-full ${linkContentClass}`}
                  >
                    {link.icon}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
        {showLogout ? (
          <SheetFooter>
            <Button
              title="Logout"
              size="sm"
              onClick={handleLogout}
              iconLeft={<LogOut />}
              className="mx-auto mb-4 gap-6 !max-w-[150px] !bg-danger/80 !border-danger hover:!max-w-[200px] hover:!bg-danger hover:!text-white"
            />
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
