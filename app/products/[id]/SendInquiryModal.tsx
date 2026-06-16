"use client";

import { useState } from "react";
import { ThumbsUp, X } from "lucide-react";

interface SendInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  description: string;
}

export default function SendInquiryModal({ isOpen, onClose }: SendInquiryModalProps) {
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    description: "",
  });

  if (!isOpen) {
    return null;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSent(true);
  }

  function handleClose() {
    onClose();
    // reset after close animation
    setTimeout(() => {
      setIsSent(false);
      setForm({ firstName: "", lastName: "", email: "", description: "" });
    }, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-inquiry-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        {isSent ? (
          <SuccessState onClose={handleClose} />
        ) : (
          <FormState
            form={form}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

function FormState({
  form,
  isSubmitting,
  onChange,
  onSubmit,
  onClose,
}: {
  form: FormState;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4 sm:px-6">
        <h2
          id="send-inquiry-title"
          className="text-xl font-semibold text-[#111827]"
        >
          Send Inquiry
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-8 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="mb-5 text-sm leading-6 text-[#4B5563]">
          Fill the form below and submit to request for a quote
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="inquiry-firstName"
              className="mb-1.5 block text-sm font-medium text-[#374151]"
            >
              First Name
            </label>
            <input
              id="inquiry-firstName"
              name="firstName"
              type="text"
              required
              placeholder="Chuks Okoro"
              value={form.firstName}
              onChange={onChange}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition focus:border-[#0669D9] focus:ring-2 focus:ring-[#0669D9]/20"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-lastName"
              className="mb-1.5 block text-sm font-medium text-[#374151]"
            >
              Last Name
            </label>
            <input
              id="inquiry-lastName"
              name="lastName"
              type="text"
              required
              placeholder="Select category"
              value={form.lastName}
              onChange={onChange}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition focus:border-[#0669D9] focus:ring-2 focus:ring-[#0669D9]/20"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-email"
              className="mb-1.5 block text-sm font-medium text-[#374151]"
            >
              Email Address
            </label>
            <input
              id="inquiry-email"
              name="email"
              type="email"
              required
              placeholder="user@gmail.com"
              value={form.email}
              onChange={onChange}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition focus:border-[#0669D9] focus:ring-2 focus:ring-[#0669D9]/20"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-description"
              className="mb-1.5 block text-sm font-medium text-[#374151]"
            >
              Description
            </label>
            <textarea
              id="inquiry-description"
              name="description"
              required
              placeholder="Enter message here..."
              value={form.description}
              onChange={onChange}
              rows={4}
              className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition focus:border-[#0669D9] focus:ring-2 focus:ring-[#0669D9]/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 h-12 w-full rounded-xl bg-[#3B66E2] text-sm font-medium text-white transition hover:bg-[#2f55cc] disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#DCFCE7]">
        <ThumbsUp size={32} className="text-[#16A34A]" />
      </div>

      <h3 className="text-xl font-semibold text-[#16A34A]">Sent</h3>
      <p className="mt-2 text-sm text-[#374151]">You will be contacted shortly</p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 h-11 w-full max-w-[200px] rounded-xl bg-[#3B66E2] text-sm font-medium text-white transition hover:bg-[#2f55cc]"
      >
        Okay
      </button>
    </div>
  );
}
