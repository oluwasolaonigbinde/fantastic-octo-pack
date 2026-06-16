"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditDeliveryAddressModalProps {
  isOpen: boolean;
  initialAddress: string;
  onClose: () => void;
  onSave: (address: string) => void;
}

export default function EditDeliveryAddressModal({
  isOpen,
  initialAddress,
  onClose,
  onSave,
}: EditDeliveryAddressModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <EditDeliveryAddressModalContent
      key={initialAddress}
      initialAddress={initialAddress}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditDeliveryAddressModalContent({
  initialAddress,
  onClose,
  onSave,
}: Omit<EditDeliveryAddressModalProps, "isOpen">) {
  const [address, setAddress] = useState(initialAddress);

  const trimmedAddress = address.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-delivery-address-title"
        className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close address editor"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#DDE0E5] text-[#4B5563]"
        >
          <X size={18} />
        </button>

        <div className="space-y-5 pr-8">
          <div>
            <h2
              id="edit-delivery-address-title"
              className="text-2xl font-semibold text-[#111827]"
            >
              Edit Delivery Address
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              This address will be saved with the order when you continue.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#4B5563]">
              Delivery address
            </span>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#017BED] focus:ring-2 focus:ring-[#017BED]/20"
              placeholder="Enter delivery address"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-[#DDE0E5] px-4 text-sm font-medium text-[#4B5563]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(trimmedAddress)}
              disabled={!trimmedAddress}
              className="h-11 rounded-xl bg-[#0669D9] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
