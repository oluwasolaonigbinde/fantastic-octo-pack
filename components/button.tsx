"use client";

import { Loader2Icon } from "lucide-react";
import React from "react";

interface ButtonProps {
  title: string;
  isBusy?: boolean;
  variant?: "primary" | "secondary" | "primaryLight" | "secondaryLight";
  size?: "sm" | "md" | "lg";
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

/**
 * Render a customizable button component.
 * @param {string} title - The text to display on the button.
 * @param {"primary" | "secondary" | "primaryLight" | "secondaryLight"} [variant="primary"] - The visual style of the button.
 * @param {"sm" | "md" | "lg"} [size="md"] - The size of the button.
 * @param {React.ReactNode} [iconLeft] - An optional icon to display on the left side of the button.
 * @param {React.ReactNode} [iconRight] - An optional icon to display on the right side of the button.
 * @param {() => void} [onClick] - The function to call when the button is clicked.
 * @param {"button" | "submit" | "reset"} [type="button"] - The HTML button type.
 * @param {boolean} [isBusy=false] - Whether the button is loading.
 * @param {boolean} [disabled=false] - Whether the button is disabled.
 * @returns
 */

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
}) => {
  const variantClasses = {
    primary:
      "bg-primary border-primary text-white hover:text-primary-dark hover:bg-primary-light disabled:hover:bg-primary/50 transition-all duration-500",
    secondary:
      "bg-secondary border-secondary text-white hover:text-secondary hover:bg-secondary-light disabled:hover:bg-secondary/50 transition-all duration-500",
    primaryLight: "bg-primary-light border-primary text-primary-dark",
    secondaryLight: "bg-secondary-light border-secondary text-secondary",
  }[variant];

  const sizeClasses = {
    sm: "py-2 px-4 text-sm rounded-xl",
    md: "py-3 px-6 rounded-xl",
    lg: "py-4 px-6 text-lg rounded-14",
  }[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex gap-2 h-fit w-full justify-center items-center border ${variantClasses} ${sizeClasses} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className || ""}`}
    >
      {isBusy && <Loader2Icon className="animate-spin" />}
      {iconLeft}
      {title}
      {iconRight}
    </button>
  );
};
