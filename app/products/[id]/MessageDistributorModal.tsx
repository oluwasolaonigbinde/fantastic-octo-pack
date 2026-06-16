"use client";

import { Button } from "@/components/base";

interface MessageDistributorModalProps {
  setIsMessageDistributorModalOpen: (isOpen: boolean) => void;
}

export default function MessageDistributorModal({
  setIsMessageDistributorModalOpen,
}: MessageDistributorModalProps) {
  return (
    <div className="space-y-4 text-white">
      <p className="text-sm leading-6">
        Messaging now opens through the authenticated dashboard compose flow.
        Use the public page Send Message action to continue.
      </p>
      <Button
        title="Close"
        variant="primary"
        size="md"
        type="button"
        onClick={() => setIsMessageDistributorModalOpen(false)}
        className="w-full bg-[#0669D9] text-white hover:bg-[#0556b8]"
      />
    </div>
  );
}

