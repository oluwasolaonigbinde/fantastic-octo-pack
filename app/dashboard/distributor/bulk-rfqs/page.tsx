import { redirect } from "next/navigation";

export default function BulkRfqsRedirectPage() {
  redirect("/dashboard/distributor/quotes?bulk=1");
}
