"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import Header from "../../../component/header";
import { Button } from "@/components/base";
import { useAdminRfqDetailQuery } from "@/hooks/queries/admin";
import { RFQ_STATUS_LABELS } from "@/types/rfq";
import {
  DetailField,
  DetailStatusBanner,
  formatMoney,
  formatQuantity,
  getFirstRfqItem,
  getItemProductName,
  getItemUnitPrice,
  getUserEmail,
  getUserName,
  getUserPhone,
  pickFirstText,
  presentDate,
} from "../../rfqs-orders/adminRfqShared";

export default function AdminRfqDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rfqId = params?.id;

  const { data, isPending, isError, error } = useAdminRfqDetailQuery(rfqId);

  const rfq = data?.rfq;
  const distributor = rfq?.targetDistributors?.[0];

  return (
    <div>
      <Header title="RFQ Details" description="Full details for this request for quote" />

      <div className="space-y-4 p-5 pt-2 lg:p-6 lg:pt-2">
        <Button
          title="Back to RFQs and Orders"
          variant="secondaryLight"
          size="sm"
          iconLeft={<ArrowLeft size={16} />}
          className="w-auto"
          onClick={() => router.push("/dashboard/admin/rfqs-orders")}
        />

        <section className="rounded-2xl border border-gray5 bg-white p-5 lg:p-8">
          {isPending ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="animate-spin text-gray3" size={28} />
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error instanceof Error ? error.message : "Unable to load RFQ details."}
            </p>
          ) : (
            <div className="space-y-6">
              <DetailStatusBanner
                label="Request Status"
                value={rfq ? RFQ_STATUS_LABELS[rfq.status] ?? rfq.status : "Not available"}
              />
              <DetailField
                label="Distributor's name"
                value={getUserName(distributor)}
              />
              <DetailField label="Distributor's phone number" value={getUserPhone(distributor)} />
              <DetailField label="Distributor's email" value={getUserEmail(distributor)} />
              <DetailField
                label="Product name"
                value={getItemProductName(rfq)}
              />
              <DetailField
                label="Quantity"
                value={formatQuantity(getFirstRfqItem(rfq)?.quantity)}
              />
              <DetailField
                label="Unit price"
                value={getItemUnitPrice(rfq, undefined)}
              />
              <DetailField label="Date of request" value={presentDate(rfq?.createdAt)} />
              <DetailField
                label="Proposed delivery date"
                value={pickFirstText(rfq?.deliveryTimeline) ?? "Not available"}
              />
              <DetailField
                label="Additional note"
                value={
                  pickFirstText(rfq?.additionalNotes, getFirstRfqItem(rfq)?.notes) ??
                  "Not available"
                }
              />

              {data && data.quotes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray2">
                    Quotes received ({data.quotes.length})
                  </p>
                  <div className="space-y-3">
                    {data.quotes.map((quote) => (
                      <div
                        key={quote._id}
                        className="rounded-xl border border-gray5 p-4"
                      >
                        <DetailField
                          label="Distributor"
                          value={getUserName(quote.distributor)}
                        />
                        <DetailField
                          label="Total price"
                          value={formatMoney(quote.totalPrice)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
