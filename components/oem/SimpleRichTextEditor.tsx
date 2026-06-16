"use client";

import { useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  MoreHorizontal,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function plainTextToRichHtml(text: string): string {
  if (!text?.trim()) {
    return "<p><br></p>";
  }

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return text
    .split("\n")
    .map((line) => `<p>${escape(line) || "<br>"}</p>`)
    .join("");
}

export function richHtmlToPlainText(html: string): string {
  const decodeHtmlEntities = (value: string) => {
    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = value;
      return textarea.value;
    }

    return value
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&");
  };

  const stripTags = (value: string) =>
    value
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " ");

  let next = html;
  for (let i = 0; i < 3; i += 1) {
    const decoded = stripTags(decodeHtmlEntities(next));
    if (decoded === next) {
      break;
    }
    next = decoded;
  }

  return next
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

type SimpleRichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  editorMinHeightClassName?: string;
};

function exec(cmd: string, value?: string) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    /* ignore */
  }
}

function normalizeOutgoingHtml(el: HTMLDivElement): string {
  const text = el.innerText.replace(/\u00a0/g, " ").trim();
  if (!text) {
    return "";
  }
  return el.innerHTML;
}

function toDisplayHtml(stored: string): string {
  if (!stored?.trim()) {
    return "<p><br></p>";
  }
  if (stored.trim().startsWith("<")) {
    return stored;
  }
  return plainTextToRichHtml(stored);
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-[26px] shrink-0 items-center justify-center rounded text-[14px] text-[#111827] transition hover:bg-black/5"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SimpleRichTextEditor({
  id,
  label,
  value,
  onChange,
  editorMinHeightClassName = "min-h-[180px]",
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) {
      return;
    }

    const display = toDisplayHtml(value);
    if (lastEmitted.current !== null && value === lastEmitted.current) {
      return;
    }
    if (el.innerHTML === display) {
      lastEmitted.current = value;
      return;
    }

    el.innerHTML = display;
    lastEmitted.current = value;
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) {
      return;
    }
    const next = normalizeOutgoingHtml(el);
    if (next === lastEmitted.current) {
      return;
    }
    lastEmitted.current = next;
    onChange(next);
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) {
      return;
    }
    const next = normalizeOutgoingHtml(el);
    if (next === lastEmitted.current) {
      return;
    }
    lastEmitted.current = next;
    onChange(next);
  };

  return (
    <div className="w-full">
      <p id={`${id}-label`} className="type-label mb-1 px-4 font-medium text-gray2">
        {label}
      </p>
      <div className="overflow-hidden rounded-xl border border-[#DDE0E5] bg-[rgba(253,254,255,0.5)]">
        <div className="flex h-[47px] items-center justify-between border-b border-[#DDE0E5] bg-[#F3F4F6] px-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-3">
              <ToolbarButton label="Bold" onClick={() => exec("bold")}>
                <Bold className="size-4" strokeWidth={2.5} />
              </ToolbarButton>
              <ToolbarButton label="Italic" onClick={() => exec("italic")}>
                <Italic className="size-4" />
              </ToolbarButton>
              <ToolbarButton label="Underline" onClick={() => exec("underline")}>
                <Underline className="size-4" />
              </ToolbarButton>
            </div>
            <div className="flex items-center gap-3 border-l border-[#DDE0E5] pl-3">
              <ToolbarButton label="Align left" onClick={() => exec("justifyLeft")}>
                <AlignLeft className="size-[13px]" />
              </ToolbarButton>
              <ToolbarButton label="Align center" onClick={() => exec("justifyCenter")}>
                <AlignCenter className="size-[13px]" />
              </ToolbarButton>
              <ToolbarButton label="Align right" onClick={() => exec("justifyRight")}>
                <AlignRight className="size-[13px]" />
              </ToolbarButton>
              <ToolbarButton label="Justify" onClick={() => exec("justifyFull")}>
                <AlignJustify className="size-[13px]" />
              </ToolbarButton>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 pl-2">
            <div className="flex items-center gap-3">
              <ToolbarButton label="Undo" onClick={() => exec("undo")}>
                <Undo2 className="size-[13px]" />
              </ToolbarButton>
              <ToolbarButton label="Redo" onClick={() => exec("redo")}>
                <Redo2 className="size-[13px]" />
              </ToolbarButton>
            </div>
            <button
              type="button"
              aria-label="More options"
              className="flex size-[26px] items-center justify-center rounded text-[#111827] opacity-60 hover:opacity-100"
              onMouseDown={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-[13px]" />
            </button>
          </div>
        </div>
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline
          aria-labelledby={`${id}-label`}
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "type-body-md w-full px-4 py-3 text-gray1 outline-none",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
            editorMinHeightClassName,
          )}
          onInput={handleInput}
          onBlur={emit}
        />
      </div>
    </div>
  );
}
