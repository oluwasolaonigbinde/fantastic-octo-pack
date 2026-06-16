"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button, Input } from "@/components/base";
import type { Product } from "@/types/product";

import { buildWeeklyRequestData } from "./oem-ui";

interface BarChartComponentProps {
  products: Product[];
}

const toDateValue = (value: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatRangeLabel = (from: string, to: string, products: Product[]) => {
  if (from && to) {
    return `${from} - ${to}`;
  }

  const dates = products
    .map((product) => product.submittedAt ?? product.createdAt)
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (!dates.length) {
    return "All listing request";
  }

  return `All listing request from ${dates[0].toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} - ${dates[dates.length - 1].toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
};

export default function BarChartComponent({ products }: BarChartComponentProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredProducts = useMemo(() => {
    const from = toDateValue(dateFrom);
    const to = toDateValue(dateTo);

    return products.filter((product) => {
      const value = toDateValue(product.submittedAt ?? product.createdAt);

      if (!value) {
        return false;
      }

      if (from && value < from) {
        return false;
      }

      if (to) {
        const inclusiveTo = new Date(to);
        inclusiveTo.setHours(23, 59, 59, 999);
        if (value > inclusiveTo) {
          return false;
        }
      }

      return true;
    });
  }, [dateFrom, dateTo, products]);

  const chartData = useMemo(
    () => buildWeeklyRequestData(filteredProducts.length ? filteredProducts : products),
    [filteredProducts, products],
  );

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-gray1">Weekly Listing Request</h2>
          <p className="text-sm text-gray3">{formatRangeLabel(dateFrom, dateTo, products)}</p>
        </div>

        <Popover.Root open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="relative w-full rounded-2xl border border-gray5 bg-white px-4 py-3 text-left text-sm text-gray3 sm:w-[220px]"
            >
              {dateFrom || dateTo ? `${dateFrom || "--"} - ${dateTo || "--"}` : "From - To"}
              <Calendar
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray4"
                size={18}
              />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              sideOffset={8}
              className="z-50 min-w-[300px] rounded-2xl border border-gray5 bg-white p-4 shadow-lg"
            >
              <div className="space-y-4">
                <Input
                  id="oem-date-from"
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
                <Input
                  id="oem-date-to"
                  label="To"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => setDateTo(event.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <Button
                    title="Clear"
                    variant="primaryLight"
                    size="sm"
                    className="!w-fit"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                  />
                  <Button
                    title="Apply"
                    size="sm"
                    className="!w-fit"
                    onClick={() => setIsDatePickerOpen(false)}
                  />
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="35%">
            <defs>
              <linearGradient id="oemChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#43A8FF" />
                <stop offset="100%" stopColor="#E9F5FF" />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: "#5E6782", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#5E6782", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "transparent" }} />
            <Bar
              dataKey="value"
              fill="url(#oemChartGradient)"
              radius={[4, 4, 0, 0]}
              barSize={26}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
