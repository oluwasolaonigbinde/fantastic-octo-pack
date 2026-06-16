import { Suspense } from "react";
import ProductPage from "./ProductPage.client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ProductPage />
    </Suspense>
  );
}