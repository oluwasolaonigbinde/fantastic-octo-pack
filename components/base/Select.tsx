"use client";

import React, { forwardRef } from "react";
import type { SelectProps as ShadcnSelectProps } from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import {
  Select as PrimitiveSelect,
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

interface SelectProps extends Omit<ShadcnSelectProps, "onValueChange"> {
  label: string;
  placeholder?: string;
  options: Option[];
  error?: string;
  maxWidth?: string;
  className?: string;
  value?: string;
  onValueChange?: (val: string) => void;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
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
      <div className={cn("flex w-full flex-col gap-[var(--control-label-gap)]", maxWidth)}>
        <label className="type-label font-medium text-gray2">{label}</label>

        <PrimitiveSelect value={value} onValueChange={onValueChange} {...props}>
          <SelectTrigger
            ref={ref}
            size="lg"
            className={cn(
              "type-title-md w-full border-gray5 bg-white px-4 text-gray1 shadow-none",
              hasError && "border-danger focus:border-danger",
              className,
            )}
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
        </PrimitiveSelect>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export const SingleSelect = Select;
