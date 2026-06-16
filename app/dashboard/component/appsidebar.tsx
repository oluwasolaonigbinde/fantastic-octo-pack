"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLink {
  id?: number;
  name: string;
  path: string;
  icon?: React.ReactNode;
  iconActive?: React.ReactNode;
}

interface SidebarProps {
  logo: string;
  baseUrl: string;
  linkClass?: "light" | "dark" | "lightBordered" | "darkBordered";
  links: SidebarLink[];
  background?: "plain" | "primary";
}

export function AppSidebar({
  logo,
  baseUrl,
  background = "plain",
  linkClass = "light",
  links,
}: SidebarProps) {
  const pathname = usePathname();

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
  return (
    <Sidebar>
      <SidebarHeader>
        <Image src={logo} alt="MedProcure logo" width={112} height={43} />
      </SidebarHeader>
      <SidebarContent>
        <aside className="sticky top-0 ">
        <div className="h-[100px] flex items-center justify-center border-b border-gray5">
          <Image src={logo} alt="MedProcure logo" width={112} height={43} />
        </div>
        <div
          className={`h-fit py-8 overflow-y-auto space-y-2 w-full ${bgClasses} overflow-y-auto`}
        >
          {links.map((link, index) => {
            const path =
              index === 0
                ? `/dashboard/${baseUrl}`
                : `/dashboard/${baseUrl}/${link.path}`;

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
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
