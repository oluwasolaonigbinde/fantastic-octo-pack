import { Button } from "@/components/base";
import { ThumbsUp } from "lucide-react";

interface RequestQuotePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestQuotePopup({ isOpen, onClose }: RequestQuotePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray1/50 z-50">
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md border border-primary">
        {/* Thumbs Up Icon */}
        <div className="flex justify-center mb-4">
          <ThumbsUp 
            size={48} 
            className="text-success" 
            strokeWidth={1.5}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-semibold text-success text-center mb-4">
          Request Quote
        </h2>

        {/* Message */}
        {/* <p className="text-sm md:text-base text-gray2 text-center mb-6 leading-relaxed">
          You have successfully requested a quote from this distributor. They will get back to you as soon as possible.
        </p> */}

        {/* Okay Button */}
        <div className="flex justify-center">
          <Button
            title="Close"
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}

