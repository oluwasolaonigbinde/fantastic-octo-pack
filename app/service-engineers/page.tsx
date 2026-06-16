import { Suspense } from "react";
import ServiceEngineersPage from "./ServiceEngineersPage.client";

export default function Page() {
  return (
    <Suspense>
      <ServiceEngineersPage />
    </Suspense>
  );
}
