"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/utils/formatDate";
import { ArrowRight, BadgeCheck, Bell, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { RightSlider } from "@/components/base";
import { useRouter } from "next/navigation";
import { useToggleSidebar } from "@/contexts/sidebar-context";
import { UserRole } from "@/types/user";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  mobileChrome?: "menu" | "profile" | "dashboard";
}

export default function Header({
  title,
  description,
  titleClassName,
  descriptionClassName,
  mobileChrome = "menu",
}: HeaderProps) {
  const { data } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const toggleSidebar = useToggleSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleNotificationOpen = () => {
    if (data?.role === "oem") {
      router.push("/dashboard/oem/notifications");
      return;
    }

    setNotificationOpen(true);
  };

  const secondaryIdentityLine =
    data?.role === UserRole.ENGINEER
      ? data?.engineerTierLabel || data?.kycBadgeLabel || "Unverified"
      : data?.kycBadgeLabel ||
        (data?.role === UserRole.BUYER ? "Basic Buyer" : data?.email);
  const engineerIdentityEmail = data?.email || "No email available";
  const agentProfileFallback =
    data?.role === UserRole.AGENT ? "/images/admin-distributor-avatar.jpg" : DEFAULT_AVATAR_SRC;
  const useAgentMobileProfileReference =
    data?.role === UserRole.AGENT && mobileChrome === "profile";
  const mobileLogoWidth = mobileChrome === "profile" ? 108 : 96;
  const mobileLogoHeight = mobileChrome === "profile" ? 40 : 36;

  return (
    <div className="text-gray1 sticky top-0 z-10">
      <nav className="w-full sticky top-0 z-50 flex h-[92px] items-center justify-between border-b border-gray5 bg-white px-4 lg:h-[100px] lg:px-3">

        {/* ── Mobile header: MedProcure logo (left) + hamburger (right) ─── */}
        <div className="flex items-center justify-between w-full lg:hidden">
          <Image
            src="/images/Logo.png"
            alt="MedProcure"
            width={mobileLogoWidth}
            height={mobileLogoHeight}
            className={cn("h-auto w-auto", mobileChrome === "profile" ? "max-h-10" : "max-h-9")}
            priority
          />
          {data?.role === UserRole.AGENT && mobileChrome === "profile" ? (
            <Link
              href={`/dashboard/${data?.role}/profile`}
              className="flex size-11 items-center justify-center"
              aria-label="Go to Profile"
            >
              {useAgentMobileProfileReference ? (
                <Image
                  src="/images/agent-profile-mobile-ref.png"
                  alt={`${data?.firstName || "User"} ${data?.lastName || ""}`}
                  width={48}
                  height={48}
                  className="size-11 rounded-full"
                  priority
                />
              ) : (
                <>
                  <Avatar className="size-10 ring-1 ring-[#E5E7EB]">
                    <AvatarImage
                      src={data?.displayPhoto?.url || agentProfileFallback}
                      alt={`${data?.firstName || "User"} ${data?.lastName || ""}`}
                    />
                    <AvatarFallback>
                      <span className="type-label-sm text-primary">
                        {data?.firstName?.split("")[0] || "U"}{data?.lastName?.split("")[0] || ""}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FE6E00] px-1 text-[9px] font-medium leading-none text-white">
                    1
                  </span>
                </>
              )}
            </Link>
          ) : mobileChrome === "dashboard" ? (
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Open notifications"
                onClick={handleNotificationOpen}
                className="relative flex h-10 w-10 items-center justify-center"
              >
                <Bell size={20} className="text-gray1" />
                <span className="absolute right-1 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium leading-none text-white">
                  3
                </span>
              </button>
              <span className="mx-2.5 h-9 w-px bg-[#E5E7EB]" />
              <button
                type="button"
                aria-label="Open navigation menu"
                onClick={toggleSidebar}
                className="flex items-center justify-center p-1.5 text-gray1"
              >
                <Menu size={30} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={toggleSidebar}
              className="flex items-center justify-center p-1.5 text-gray1 rounded-lg"
            >
              <Menu size={28} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* ── Desktop header: page title (left) + bell + avatar (right) ── */}
        <div className="hidden lg:flex gap-4 items-center">
          <div>
            <h1 className={cn("type-heading-lg font-semibold", titleClassName)}>
              {title}
            </h1>
            <p className={cn("type-body-md text-gray2", descriptionClassName)}>
              {description || formatDate(new Date())}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex w-fit">
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Open notifications"
              onClick={handleNotificationOpen}
              className="relative flex items-center justify-center border-x border-gray5 h-full px-5 py-6 cursor-pointer group"
            >
              <Bell className="group-hover:scale-105 transition-transform duration-500" />
              <span className="type-micro pointer-events-none absolute right-2 top-5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-white">
                3
              </span>
            </button>

            <Link
              href={`/dashboard/${data?.role}/profile`}
              className="flex gap-2 items-center space-between"
              aria-label="Go to Profile"
            >
              <Avatar className="size-[2.875rem]">
                <AvatarImage
                  src={data?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                  alt={`${data?.firstName || "User"} ${data?.lastName || ""}`}
                />
                <AvatarFallback>
                  <span className="type-label-sm text-primary">
                    {data?.firstName?.split('')[0] || "U"}{data?.lastName?.split('')[0] || ""}
                  </span>
                </AvatarFallback>
              </Avatar>

              <div className="hidden lg:block">
                {data?.role === UserRole.DISTRIBUTOR ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-gray1">
                      {`Hello, ${data?.firstName || "User"} ${data?.lastName || ""}`}
                    </p>
                    <p className="text-xs text-gray3">{data?.email}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-gray3">
                      {data?.kycBadgeLabel || "Registered seller"}
                      <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
                    </p>
                  </div>
                ) : data?.role === UserRole.ENGINEER ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap text-gray1">
                      {`Hello, ${data?.firstName || "User"} ${data?.lastName || ""}`}
                    </p>
                    <p className="text-xs text-gray3">{engineerIdentityEmail}</p>
                    <p className="text-xs text-gray3">{secondaryIdentityLine}</p>
                  </div>
                ) : (
                  <>
                    <p className="inline-flex items-center justify-between w-full text-sm font-medium whitespace-nowrap text-gray1">
                      {`Hello, ${data?.firstName || "User"} ${data?.lastName || ""}`}
                    </p>
                    {data?.role === UserRole.BUYER || data?.kycBadgeLabel ? (
                      <p className="text-xs text-gray3 inline-flex items-center gap-1">
                        {secondaryIdentityLine}
                        <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
                      </p>
                    ) : (
                      <p className="text-xs text-gray3">{secondaryIdentityLine}</p>
                    )}
                  </>
                )}
              </div>
              <ArrowRight size={16} className="hidden text-gray3 lg:block" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Notifications */}
      <RightSlider
        title="Notifications"
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      >
        <p>Notifications</p>
      </RightSlider>

      {/* Profile */}
      <RightSlider
        title="Profile"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      >
        <p>Profile</p>
      </RightSlider>
    </div>
  );
}

