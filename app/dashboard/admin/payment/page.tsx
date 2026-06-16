"use client";

import { CreditCard, Eye, Filter, Wallet } from "lucide-react";
import Header from "../../component/header";
import { Button, Input, SummaryCard } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/*  Mock data matching Figma                                           */
/* ------------------------------------------------------------------ */

const PAYMENT_ROWS = Array.from({ length: 9 }).map((_, i) => ({
  id: `pay-${i + 1}`,
  orderId: "The order ID",
  buyerId: "Buyer ID/name",
  sellerId: "Samuel S.",
  nameOfItem: "MRI machine",
  engineerId: "Samuel S.",
  status: (["Under dispute", "Delivered", "Payment", "Delivered", "Delivered", "Under dispute", "Under dispute", "Under dispute", "Under dispute"] as const)[i],
  dateTime: "25/11/25 - 08:00 AM",
}));

const statusColor: Record<string, string> = {
  "Under dispute": "text-warning",
  Delivered: "text-success",
  Payment: "text-danger",
};


export default function AdminPaymentPage() {
  return (
    <div>
      <Header
        title="Payment"
        description="View and track all invoice payment"
      />

      <div className="space-y-8 p-4 md:p-6">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total ESCROW balance"
            value="₦1,208,556.78"
            icon={<Wallet size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
          />
          <SummaryCard
            title="Total pending disbursements"
            value="₦518,886.98 (10)"
            icon={<CreditCard size={18} className="text-[#C04FE0]" />}
            iconBg="bg-[#F8E8FF]"
          />
          <SummaryCard
            title="Total disbursements"
            value="₦410,032,800.00 (10)"
            icon={<CreditCard size={18} className="text-[#13A83B]" />}
            iconBg="bg-[#E8FAEE]"
          />
          <SummaryCard
            title="Processed refunds"
            value="₦108,998.09"
            icon={<CreditCard size={18} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
          />
        </div>

        {/* Table section */}
        <section className="card space-y-4">
          <h3 className="medium3 text-gray1">All Escrow Orders</h3>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
            Filter table list by:
          </p>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1.5fr_1fr_auto]">
            <Input label="Escrow status" placeholder="Enter escrow status" />
            <Input label="Name of item" placeholder="Enter name of item" />
            <Input label="Date & time" type="date" />
            <Button
              title="Filter"
              iconLeft={<Filter size={16} />}
              className="self-end"
              type="button"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer ID</TableHead>
                  <TableHead>Seller ID</TableHead>
                  <TableHead>Name of item</TableHead>
                  <TableHead>Engineer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAYMENT_ROWS.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-gray1">
                      {row.orderId}
                    </TableCell>
                    <TableCell>{row.buyerId}</TableCell>
                    <TableCell>{row.sellerId}</TableCell>
                    <TableCell>{row.nameOfItem}</TableCell>
                    <TableCell>{row.engineerId}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${statusColor[row.status] ?? "text-gray3"}`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.dateTime}
                    </TableCell>
                    <TableCell>
                      <Button
                        title="View"
                        variant="primaryLight"
                        size="sm"
                        iconLeft={<Eye size={14} />}
                        className="w-auto"
                        type="button"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
