import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  /** Raw markdown authored in the product wizard (e.g. **bold**, - bullets). */
  content: string;
  className?: string;
}

/**
 * Renders seller-authored markdown descriptions. Product descriptions are
 * captured as markdown in the listing wizard (bold, underline, bullet and
 * numbered lists), so they must be parsed here instead of printed verbatim.
 *
 * Tailwind's preflight strips default list/heading styling, so each element is
 * styled explicitly to keep the output readable without the typography plugin.
 * Raw HTML is intentionally not enabled — the wizard forbids `<`/`>`, and
 * react-markdown escapes any HTML by default, so this stays injection-safe.
 */
export default function MarkdownContent({
  content,
  className,
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-7 text-[#4B5563] md:text-base md:leading-8",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#111827]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0669D9] underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => (
            <h3 className="text-lg font-semibold text-[#111827]">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-lg font-semibold text-[#111827]">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-base font-semibold text-[#111827]">{children}</h4>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
