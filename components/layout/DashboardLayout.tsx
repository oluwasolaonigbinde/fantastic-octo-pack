"use client";

import DashboardSidebar, { type DashboardLink } from "./DashboardSidebar";
import DashboardMobileSidebar from "./DashboardMobileSidebar";
import { useSidebarState, useToggleSidebar } from "@/contexts/sidebar-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
  links: DashboardLink[];
  baseUrl: string;
  logo: string;
  background?: "plain" | "primary";
  linkClass?: "light" | "dark" | "lightBordered" | "darkBordered";
  textColor?: string;
  contentClassName?: string;
  showBackToWebsite?: boolean;
  showLogout?: boolean;
  /** Optional sidebar surface tint (e.g. Service Engineer shell). */
  sidebarSurfaceClassName?: string;
  /** Optional desktop sidebar nav offset. */
  sidebarNavClassName?: string;
}

export function DashboardLayout({
  children,
  links,
  baseUrl,
  logo,
  background = "plain",
  linkClass = "light",
  textColor,
  contentClassName = "w-full relative bg-gray7",
  showBackToWebsite = true,
  showLogout = true,
  sidebarSurfaceClassName,
  sidebarNavClassName,
}: DashboardLayoutProps) {
  const { state } = useSidebarState();
  const toggleSidebar = useToggleSidebar();

  return (
    <div>
      <div className="flex w-full">
        <div className="lg:hidden">
          <DashboardMobileSidebar
            open={state === "expanded"}
            onClose={toggleSidebar}
            logo={logo}
            links={links}
            baseUrl={baseUrl}
            background={background}
            linkClass={linkClass}
            textColor={textColor}
            surfaceClassName={sidebarSurfaceClassName}
            showBackToWebsite={showBackToWebsite}
            showLogout={showLogout}
          />
        </div>
        <div
          className={`hidden w-[248px] shrink-0 self-stretch border-r lg:block ${
            sidebarSurfaceClassName ?? ""
          }`}
        >
          <DashboardSidebar
            logo={logo}
            links={links}
            baseUrl={baseUrl}
            background={background}
            linkClass={linkClass}
            textColor={textColor}
            surfaceClassName={sidebarSurfaceClassName}
            navClassName={sidebarNavClassName}
            showBackToWebsite={showBackToWebsite}
            showLogout={showLogout}
          />
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}

export type { DashboardLink };
