"use client";

import type { ReactNode } from "react";
import Header from "@/app/dashboard/component/header";

type AdminSectionPageProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminSectionPage({
  title,
  description,
  children,
}: AdminSectionPageProps) {
  return (
    <div>
      <Header title={title} description={description} />
      <div className="space-y-4 p-4 md:p-6">{children}</div>
    </div>
  );
}
