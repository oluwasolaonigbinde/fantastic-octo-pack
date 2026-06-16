"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

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
    const baseClasses = `block w-full rounded-xl border px-4 py-3 text-gray1 placeholder-gray4 focus:outline-none focus:border-gray2 sm:text-sm ${
      hasError ? "border-danger focus:active:border-danger" : "border-gray5"
    }`;
    const combinedClasses = `${baseClasses} ${className || ""}`;
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className={`flex flex-col w-full ${maxWidth || ""}`}>
        <label htmlFor={id} className="block text-gray1 pl-3">
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
            className={
              combinedClasses.trim() +
              " disabled:bg-gray7 disabled:cursor-not-allowed"
            }
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray4 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>

        {error && <p className=" text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
