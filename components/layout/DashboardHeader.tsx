"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, RightSlider } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useToggleSidebar } from "@/contexts/sidebar-context";
import { formatDate } from "@/utils/formatDate";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { UserRole } from "@/types/user";
import { getPartyDisplayName, getPartyInitials } from "@/utils/partyDisplayName";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export default function DashboardHeader({
  title,
  description,
}: DashboardHeaderProps) {
  const { data } = useAppSelector((state) => state.auth);
  const toggleSidebar = useToggleSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const secondaryIdentityLine =
    data?.role === UserRole.ENGINEER
      ? data?.engineerTierLabel || data?.kycBadgeLabel || "Unverified"
      : data?.kycBadgeLabel || data?.email;
  const accountName = getPartyDisplayName(data, "User");
  const accountInitials = getPartyInitials(data, "User");

  return (
    <div className="text-gray1 sticky top-0 z-10">
      <nav className="w-full sticky top-0 z-50 flex items-center justify-between h-[100px] w-full  border-b border-gray5 bg-white px-3">
        <div className="flex gap-4 items-center">
          <button onClick={toggleSidebar} className="lg:hidden">
            <PanelLeft />
          </button>
          <div>
            <h1 className="type-heading-lg font-semibold">{title}</h1>
            <p className="type-body-md text-gray2">
              {description || formatDate(new Date())}
            </p>
          </div>
        </div>
        <div className="flex w-fit">
          <div className="flex gap-3">
            <button
              onClick={() => setNotificationOpen(true)}
              className="flex flex-col items-center justify-center border-x border-gray5 h-full px-3 py-6 cursor-pointer group"
            >
              <Bell className="group-hover:scale-105 transition-tranform duration-500" />
              <span className="type-micro group-hover:scale-105 transition-tranform duration-500 bg-primary flex items-center justify-center rounded-full size-4 text-white">
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
                  alt={accountName}
                />
                <AvatarFallback>
                  <span className="type-label-sm text-primary">{accountInitials}</span>
                </AvatarFallback>
              </Avatar>

              <div className="hidden lg:block min-w-0 max-w-[200px]">
                <p className="truncate text-sm" title={accountName}>
                  {`Hello, ${accountName}`}
                </p>
                <p className="text-xs text-gray3 truncate">{secondaryIdentityLine}</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <RightSlider
        title="Notifications"
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      >
        <p>Notifications</p>
      </RightSlider>

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
