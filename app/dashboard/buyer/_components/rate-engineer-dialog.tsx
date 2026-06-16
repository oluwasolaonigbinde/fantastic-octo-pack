"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/base/Dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/hooks/useAppSelector";
import { reviewService } from "@/services/reviewService";

interface RateEngineerDialogProps {
  open: boolean;
  onClose: () => void;
  serviceRequestId: string;
  engineerName: string;
  onSuccess: () => void;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function RateEngineerDialog({
  open,
  onClose,
  serviceRequestId,
  engineerName,
  onSuccess,
}: RateEngineerDialogProps) {
  const { data } = useAppSelector((state) => state.auth);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    if (!data?.tokens?.accessToken) {
      setError("Session expired. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await reviewService.createReview(data.tokens.accessToken, {
        serviceRequestId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setError("");
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {submitted ? "Review Submitted" : "Rate Engineer"}
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "Thank you for your feedback!"
              : `How was your experience with ${engineerName}?`}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <Button title="Close" variant="primary" onClick={handleClose} />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-500">Tap a star to rate</p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <Textarea
              label="Comment (optional)"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                title="Cancel"
                variant="secondaryLight"
                onClick={handleClose}
                className="flex-1"
              />
              <Button
                title="Submit Review"
                variant="primary"
                onClick={handleSubmit}
                isBusy={submitting}
                disabled={submitting || rating === 0}
                className="flex-1"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
