import PublicFooter from "./PublicFooter";
import PublicNavBar from "./PublicNavBar";

interface PublicLayoutProps {
  children?: React.ReactNode;
  banner?: React.ReactNode;
  contentClassName?: string;
}

export function PublicLayout({
  children,
  banner,
  contentClassName,
}: PublicLayoutProps) {
  return (
    <div>
      <PublicNavBar />
      {banner}
      <div className={contentClassName}>{children}</div>
      <PublicFooter />
    </div>
  );
}
