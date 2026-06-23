"use client";

import { useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  addOrderDisputeComment,
  addOrderDisputeEvidence,
} from "@/store/slices/order-dispute-slice";

/**
 * The "Add your response" composer shared by the buyer and distributor dispute
 * detail pages. Posts a comment (`POST /comments`) and/or uploads an attachment
 * (`POST /evidence`) for the dispute.
 */
export function AddDisputeResponse({ disputeId }: { disputeId: string }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!token) return;
    if (!message.trim() && !file) return;
    setSubmitting(true);
    setError("");
    try {
      if (message.trim()) {
        await dispatch(
          addOrderDisputeComment({ token, disputeId, text: message.trim() }),
        ).unwrap();
      }
      if (file) {
        await dispatch(
          addOrderDisputeEvidence({ token, disputeId, file }),
        ).unwrap();
      }
      setMessage("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-base font-semibold text-[#111827]">Add your response</h2>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type your response here"
        className="mt-5 min-h-[72px] w-full resize-none rounded-xl border border-[#DDE0E5] px-3 py-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#017BED] px-3 py-2 text-sm font-medium text-[#017BED]"
          >
            <Paperclip size={15} />
            {file ? file.name : "Attach File"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept="image/*,application/pdf,.doc,.docx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-sm text-[#6B7280]">
            You can upload images, file or documents (max 10MB)
          </p>
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={submitting || (!message.trim() && !file)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send"}
          <Send size={15} />
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-[#EF4444]">{error}</p> : null}
    </section>
  );
}

export default AddDisputeResponse;
