import type { Metadata } from "next";
import PoliciesPage from "./PoliciesPage.client";

export const metadata: Metadata = {
  title: "Policies | BAIY",
  description: "Review BAIY's returns, shipping, and acceptable use policies.",
};

export default function Page() {
  return <PoliciesPage />;
}
