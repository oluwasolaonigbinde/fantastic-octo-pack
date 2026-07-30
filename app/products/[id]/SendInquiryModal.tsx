"use client";

import { useState } from "react";
import { ThumbsUp, X, AlertCircle } from "lucide-react";

import type { ProductInquiryDto } from "@/types/product";

interface SendInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: ProductInquiryDto) => Promise<void>;
}

type Step = "form" | "sent" | "error";

const EMPTY_FORM: ProductInquiryDto = {
  firstName: "",
  lastName: "",
  email: "",
  description: "",
};

export default function SendInquiryModal({
  isOpen,
  onClose,
  onSubmit,
}: SendInquiryModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<ProductInquiryDto>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep("form");
    setForm(EMPTY_FORM);
    setFieldError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChange =
    (field: keyof ProductInquiryDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.description.trim()) {
      setFieldError("Please fill in all fields.");
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setStep("sent");
    } catch {
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-inquiry-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        {step === "form" && (
          <>
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-5">
              <h2
                id="send-inquiry-title"
                className="text-xl font-semibold text-[#111827]"
              >
                Send Inquiry
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
              <p className="text-sm text-[#4B5563]">
                Fill the form below and submit to request for a quote
              </p>

              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="inquiry-first-name"
                    className="mb-1.5 block text-sm font-medium text-[#111827]"
                  >
                    First Name
                  </label>
                  <input
                    id="inquiry-first-name"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="Chuks Okoro"
                    maxLength={80}
                    className="h-11 w-full rounded-xl border border-[#DDE0E5] px-4 text-sm text-[#111827] outline-none transition focus:border-[#0669D9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inquiry-last-name"
                    className="mb-1.5 block text-sm font-medium text-[#111827]"
                  >
                    Last Name
                  </label>
                  <input
                    id="inquiry-last-name"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Enter your last name"
                    maxLength={80}
                    className="h-11 w-full rounded-xl border border-[#DDE0E5] px-4 text-sm text-[#111827] outline-none transition focus:border-[#0669D9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inquiry-email"
                    className="mb-1.5 block text-sm font-medium text-[#111827]"
                  >
                    Email Address
                  </label>
                  <input
                    id="inquiry-email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="user@gmail.com"
                    className="h-11 w-full rounded-xl border border-[#DDE0E5] px-4 text-sm text-[#111827] outline-none transition focus:border-[#0669D9]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inquiry-description"
                    className="mb-1.5 block text-sm font-medium text-[#111827]"
                  >
                    Description
                  </label>
                  <textarea
                    id="inquiry-description"
                    value={form.description}
                    onChange={handleChange("description")}
                    placeholder="Enter message here..."
                    maxLength={5000}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#0669D9]"
                  />
                </div>
              </div>

              {fieldError && (
                <p className="mt-3 text-sm text-[#D92D20]">{fieldError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </>
        )}

        {step === "sent" && (
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-8">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#E6F9EC]">
              <ThumbsUp size={32} className="text-[#13A83B]" />
            </div>
            <h2 className="text-xl font-semibold text-[#13A83B]">Sent</h2>
            <p className="mt-2 text-sm text-[#4B5563]">
              You will be contacted shortly
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE]"
            >
              Okay
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-8">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#FEE4E2]">
              <AlertCircle size={32} className="text-[#D92D20]" />
            </div>
            <h2 className="text-xl font-semibold text-[#D92D20]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#4B5563]">Please try again.</p>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE]"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
