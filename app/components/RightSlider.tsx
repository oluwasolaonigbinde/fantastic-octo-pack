import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SheetDemoProps {
  title: string | React.ReactNode;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function RightSlider({
  title,
  open,
  onClose,
  children,
}: SheetDemoProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="px-6 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
