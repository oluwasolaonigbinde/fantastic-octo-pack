import { AlertTriangle, AlertOctagon, ThumbsUp } from "lucide-react";
import { Button } from "@/components/base/Button";
import {
  Dialog as PrimitiveDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PopupType = "success" | "warning" | "info";
export type PopupVariant = "one-button" | "two-buttons" | "no-buttons";

interface ModalProps {
  open: boolean;
  description: string;
  title?: string;
  variant?: PopupVariant;
  type?: PopupType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onClose?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  showIcon?: boolean;
}

export function Modal({
  type = "success",
  variant = "one-button",
  open,
  title,
  description,
  primaryButtonText = "Proceed",
  secondaryButtonText = "Cancel",
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  showIcon = true,
}: ModalProps) {
  const typeConfig = {
    success: {
      icon: ThumbsUp,
      defaultTitle: "Congratulations",
      style: "border-success text-success",
      iconStyle: "text-success",
    },
    warning: {
      icon: AlertTriangle,
      defaultTitle: "Hold Up!!!",
      style: "border-warning text-warning",
      iconStyle: "text-warning",
    },
    info: {
      icon: AlertOctagon,
      defaultTitle: "Notice",
      style: "border-warning text-warning",
      iconStyle: "text-warning",
    },
  }[type];

  const IconComponent = typeConfig.icon;
  const displayTitle = title || typeConfig.defaultTitle;

  const handlePrimaryAction = () => {
    onPrimaryAction?.();
    if (variant === "one-button") {
      onClose?.();
    }
  };

  const handleSecondaryAction = () => {
    onSecondaryAction?.();
    onClose?.();
  };

  return (
    <PrimitiveDialog open={open} onOpenChange={onClose || (() => {})}>
      <DialogContent
        className={`w-full !max-w-[400px] bg-card rounded-2xl border-2 p-6 !space-y-4 text-center transition duration-400 ease-in-out ${typeConfig.style}`}
      >
        <DialogHeader className="hidden">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>

        {showIcon && (
          <div className={`mx-auto w-12 h-12 ${typeConfig.iconStyle}`}>
            <IconComponent className="w-full h-full" />
          </div>
        )}

        <h3 className="text-xl font-semibold text-gray-900">{displayTitle}</h3>

        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

        {variant !== "no-buttons" && (
          <div
            className={`flex gap-3 ${
              variant === "two-buttons" ? "justify-between" : "justify-center"
            }`}
          >
            {variant === "two-buttons" && (
              <Button
                title={secondaryButtonText}
                variant="secondary"
                onClick={handleSecondaryAction}
                className="!max-w-[200px]"
              />
            )}
            <Button
              title={primaryButtonText}
              variant={type === "warning" ? "secondary" : "primary"}
              onClick={handlePrimaryAction}
              className="!max-w-[200px]"
            />
          </div>
        )}
      </DialogContent>
    </PrimitiveDialog>
  );
}

export const PopUp = Modal;
