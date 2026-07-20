"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface EngineerTagFieldProps {
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
}

export default function EngineerTagField({
  label,
  hint = "Select all that apply",
  placeholder = "Type and press Enter to add",
  values,
  onChange,
}: EngineerTagFieldProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();
    if (!value) return;
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div>
      <p className="type-label font-medium text-gray2">{label}</p>
      <p className="mt-1 text-sm text-gray3">{hint}</p>

      <div className="mt-3 rounded-lg border border-gray5 p-3">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {values.map((item) => (
              <span
                key={item}
                className="inline-flex max-w-full items-center gap-2 rounded-lg bg-gray7 px-3 py-2 text-sm text-gray1"
              >
                <span className="truncate">{item}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => onChange(values.filter((tag) => tag !== item))}
                  className="shrink-0 text-gray3 transition hover:text-gray1"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray4">Nothing added yet</p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            aria-label={`Add ${label}`}
            className="type-title-md h-[var(--control-height-lg)] w-full rounded-lg border border-gray5 bg-white px-4 text-gray1 outline-none transition-[border-color] placeholder:text-gray4 focus:border-ring"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex h-[var(--control-height-lg)] shrink-0 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary transition hover:bg-primary-light"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
