import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DrawerProps {
  title: string | React.ReactNode;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
}

export function Drawer({
  title,
  open,
  onClose,
  children,
  contentClassName,
  bodyClassName,
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className={contentClassName ?? "overflow-y-auto"}>
        <SheetHeader className="h-[72px] justify-center border-b border-gray6 px-10 py-0">
          <SheetTitle className="text-xl font-medium leading-8 text-gray1">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className={bodyClassName ?? "px-10 pb-10"}>{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export const RightSlider = Drawer;
