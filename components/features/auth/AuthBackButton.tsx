"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  clearAuthFlowContext,
  resolveAuthWebsiteBackPath,
} from "@/utils/pendingAuth";

type AuthBackButtonProps = {
  label?: string;
  onClick?: () => void;
};

export function AuthBackButton({
  label = "Go Back",
  onClick,
}: AuthBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    const websiteBackPath = resolveAuthWebsiteBackPath();
    clearAuthFlowContext();
    router.push(websiteBackPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
