"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import AddNewProduct from "../../new/add-new-product.client";

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddNewProduct productId={typeof id === "string" ? id : undefined} />
    </Suspense>
  );
}
