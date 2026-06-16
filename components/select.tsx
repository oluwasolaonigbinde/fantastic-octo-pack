"use client";

import React, { forwardRef } from "react";
import type { SelectProps as ShadcnSelectProps } from "@radix-ui/react-select";
import {
  Select as MySelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  label: string;
  value: string;
}

interface SingleSelectProps extends Omit<ShadcnSelectProps, "onValueChange"> {
  label: string;
  placeholder?: string;
  options: Option[];
  error?: string;
  maxWidth?: string;
  className?: string;
  value?: string;
  onValueChange?: (val: string) => void;
}

export const SingleSelect = forwardRef<HTMLButtonElement, SingleSelectProps>(
  (
    {
      label,
      placeholder = "Select an option",
      options,
      error,
      maxWidth,
      value,
      onValueChange,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className={`flex flex-col w-full ${maxWidth || ""}`}>
        <label className="block text-gray1 pl-3">{label}</label>

        <MySelect 
          value={value}
          onValueChange={onValueChange}
          {...props}
        >
          <SelectTrigger
            ref={ref}
            className={`w-full rounded-xl border px-4 py-6 text-gray1 border-gray5 focus:outline-none focus:border-gray2 sm:text-sm ${
              hasError ? "border-danger focus:border-danger" : ""
            } ${className || ""}`}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup className="space-y-0">
              <SelectLabel>{label}</SelectLabel>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </MySelect>

        {error && <p className="text-sm text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

SingleSelect.displayName = "SingleSelect";