"use client";

import { Loader2Icon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  isBusy?: boolean;
  variant?: "primary" | "secondary" | "primaryLight" | "secondaryLight";
  size?: "sm" | "md" | "lg";
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  iconRight,
  iconLeft,
  onClick,
  type = "button",
  disabled = false,
  className,
  isBusy,
  children,
  ...props
}) => {
  const variantClasses = {
    primary:
      "border-primary bg-primary text-white hover:bg-primary-dark",
    secondary:
      "border-secondary bg-secondary text-white hover:bg-secondary-dark",
    primaryLight:
      "border-primary/25 bg-primary-light text-primary hover:bg-primary-light/80",
    secondaryLight:
      "border-secondary/20 bg-secondary-light text-secondary hover:bg-secondary-light/80",
  }[variant];

  const sizeClasses = {
    sm: "type-body-md h-10 rounded-lg px-5",
    md: "type-title-md h-14 rounded-lg px-6",
    lg: "type-title-md h-14 rounded-lg px-6",
  }[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 border font-normal transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-light",
        variantClasses,
        sizeClasses,
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
      {...props}
    >
      {isBusy && <Loader2Icon className="size-4 animate-spin" />}
      {iconLeft}
      {children ?? title}
      {iconRight}
    </button>
  );
};
