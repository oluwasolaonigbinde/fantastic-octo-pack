"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  maxWidth?: string;
  onValueChange?: (val: string) => void;
}

/**
 * A customizable textarea component.
 * @param {string} label - The label for the textarea.
 * @param {string} [error] - An optional error message to display.
 * @param {string} [maxWidth] - An optional maximum width for the textarea.
 * @param {(val: string) => void} [onValueChange] - Callback function when the textarea value changes.
 * @returns A textarea component.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      value,
      placeholder,
      error,
      maxWidth,
      onValueChange,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      onChange?.(e);
      onValueChange?.(e.target.value);
    }

    const baseClasses =
      "flex w-full min-h-16 rounded-xl border border-gray5 bg-transparent px-4 py-3 text-gray1 placeholder-gray4 focus:outline-none focus:border-gray2 sm:text-sm transition-[color,box-shadow]";
    const errorClasses = hasError
      ? "border-danger focus:border-danger"
      : "focus:border-gray2";
    const disabledClasses =
      "disabled:cursor-not-allowed disabled:opacity-50";
    const combinedClasses = cn(baseClasses, errorClasses, disabledClasses, className);

    return (
      <div className={`flex flex-col w-full ${maxWidth || ""}`}>
        <label htmlFor={id} className="block text-gray1 pl-3">
          {label}
        </label>

        <textarea
          ref={ref}
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className={combinedClasses.trim()}
          {...props}
        />

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
