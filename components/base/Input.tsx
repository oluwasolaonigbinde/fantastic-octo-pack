"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  maxWidth?: string;
  onValueChange?: (val: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      value,
      id,
      placeholder,
      label,
      maxWidth,
      error,
      onValueChange,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      onChange?.(e);
      onValueChange?.(e.target.value);
    }

    const hasError = !!error;
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const combinedClasses = cn(
      "type-title-md block h-[var(--control-height-lg)] w-full rounded-lg border bg-white pl-4 pr-[10px] text-gray1 placeholder:text-gray4 outline-none transition-[border-color,box-shadow]",
      hasError ? "border-danger focus:border-danger" : "border-gray5 focus:border-ring",
      isPassword && "pr-11",
      "disabled:cursor-not-allowed disabled:bg-gray7 disabled:text-gray3",
      className,
    );

    return (
      <div className={cn("flex w-full flex-col gap-[var(--control-label-gap)]", maxWidth)}>
        <label htmlFor={id} className="type-label font-medium text-gray2">
          {label}
        </label>
        <div className="relative w-full">
          <input
            ref={ref}
            type={inputType}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            className={combinedClasses}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray4 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
