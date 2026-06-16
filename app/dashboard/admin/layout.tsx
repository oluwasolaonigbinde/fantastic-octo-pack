import { AdminLayout } from "@/components/layout";

export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>{children}</AdminLayout>;
}
