"use client";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/base";
import { LogOut } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { logout } from "@/store/slices/auth-slice";

interface SidebarLink {
  id?: number;
  name: string;
  path: string;
  icon?: React.ReactNode;
  iconActive?: React.ReactNode;
  disabled?: boolean;
}

interface SidebarProps {
  logo: string;
  baseUrl: string;
  open: boolean;
  onClose: () => void;
  linkClass?: "light" | "dark" | "lightBordered" | "darkBordered";
  links: SidebarLink[];
  background?: "plain" | "primary";
}

/**
 * SideNav is a component that renders a sidebar navigation menu.
 * @param logo - The logo image to be displayed in the sidebar.
 * @param baseUrl - The base URL for the sidebar links.
 * @param open - Triggers the sidebar.
 * @param onClose - Callback functio to handle the close event.
 * @param baseUrl - The base URL for the sidebar links.
 * @param background - The background color of the sidebar.
 * @param linkClass - The class for styling the sidebar links.
 * @param links - The array of sidebar links.
 * @returns
 */

export default function MobileSideBar({
  logo,
  baseUrl,
  open,
  onClose,
  background = "plain",
  linkClass = "light",
  links,
}: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const isActive = (href: string) => pathname === href;

  const bgClasses = {
    plain: "bg-white",
    primary: "bg-primary-dark",
  }[background];

  const linkStyle = {
    light:
      "hover:translate-x-2 text-gray1 transition-all duration-500 hover:text-primary-dark",
    lightBordered:
      "text-gray1 hover:translate-x-2 transition-all duration-500 hover:text-primary-dark hover:border-primary-dark",
    dark: "hover:translate-x-2 transition-all duration-500 text-primary-light hover:text-primary-dark",
    darkBordered:
      "hover:translate-x-2 transition-all duration-500 text-primary-light hover:text-primary-dark hover:border-primary-light",
  }[linkClass];

  const activeClass = {
    light: "bg-primary-light text-primary-dark",
    lightBordered: "border-primary-dark",
    dark: "bg-primary-light text-primary-dark",
    darkBordered: "border-primary-light",
  }[linkClass];

  const borderClass = {
    light: "",
    lightBordered: "border-primary-dark",
    dark: "",
    darkBordered: "border-primary-light",
  }[linkClass];

  const dotClass = {
    plain: "bg-primary-dark",
    primary: "bg-primary-light",
  }[background];

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className={`!max-w-[240px] ${bgClasses}`}>
        <SheetHeader className="hidden">
          <SheetTitle>n</SheetTitle>
        </SheetHeader>
        <aside className="sticky top-0 ">
          <div className="h-[100px] flex items-center pl-6 border-b border-gray5">
            <Image src={logo} alt="MedProcure logo" width={112} height={43} />
          </div>
          <div
            className={`h-fit py-8 overflow-y-auto space-y-2 w-full overflow-y-auto`}
          >
            {links.map((link, index) => {
              const path =
                index === 0
                  ? `/dashboard/${baseUrl}`
                  : `/dashboard/${baseUrl}/${link.path}`;

              if (link.disabled) {
                return (
                  <span
                    key={link.path}
                    className={`group flex items-center px-3 gap-2 border-r border-transparent ${borderClass} opacity-40 cursor-not-allowed pointer-events-none`}
                  >
                    <span className="invisible size-[8px] rounded-full" />
                    <span className={`flex gap-2 py-3 px-3 rounded-2xl w-full`}>
                      {link.icon}
                      {link.name}
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={link.path}
                  href={path}
                  className={`group flex items-center px-3 gap-2 border-r border-transparent ${borderClass}`}
                >
                  <span
                    className={`${
                      isActive(path) ? "visible" : "invisible"
                    } group-hover:visible size-[8px] rounded-full ${dotClass}`}
                  />
                  <span
                    className={`flex gap-2 py-3 px-3 rounded-2xl w-full ${linkStyle} ${
                      isActive(path) ? activeClass : ""
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>
        <SheetFooter>
          <Button
            title="Logout"
            size="sm"
            onClick={handleLogout}
            iconLeft={<LogOut />}
            className="mx-auto mb-4 gap-6 !max-w-[150px] !bg-danger/80 !border-danger hover:!max-w-[200px] hover:!bg-danger hover:!text-white"
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

