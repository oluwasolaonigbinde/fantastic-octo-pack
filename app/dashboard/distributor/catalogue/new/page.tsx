import { Suspense } from "react";
import AddNewProduct from "./add-new-product.client";


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddNewProduct />
    </Suspense>
  );
}