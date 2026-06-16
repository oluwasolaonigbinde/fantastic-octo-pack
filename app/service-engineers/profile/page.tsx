import { Suspense } from "react";
import EngineerProfilePage from "./EngineerProfilePage.client";

export default function Page() {
  return (
    <Suspense>
      <EngineerProfilePage />
    </Suspense>
  );
}
