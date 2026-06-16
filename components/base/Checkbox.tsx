import { Check } from "lucide-react";
import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  id?: string;
  name?: string;
  label?: string;
  /** Figma: middle row uses solid primary fill when checked; others use outline. */
  appearance?: "outline" | "filledPrimary";
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = "",
  size = 20,
  id,
  name,
  label,
  appearance = "outline",
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        id={id}
        name={name}
        className="sr-only"
      />
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          inline-flex items-center justify-center
          border-2 transition-all duration-200 p-px
          focus:outline-none focus:ring-2 focus:ring-gray5 focus:ring-offset-1 rounded
          ${
            appearance === "filledPrimary" && checked
              ? "border-[#0669D9] bg-[#0669D9] text-white"
              : "border-gray2 bg-white text-gray1 hover:border-gray00"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
        style={{ width: size, height: size }}
        tabIndex={0}
      >
        <Check
          className={`${checked ? "visible" : "invisible"} ${appearance === "filledPrimary" && checked ? "text-white" : ""}`}
          strokeWidth={appearance === "filledPrimary" && checked ? 2.5 : 2}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 text-sm font-normal leading-5 text-[#111827] cursor-pointer ${disabled ? "opacity-50" : ""}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export const CustomCheckbox = Checkbox;
