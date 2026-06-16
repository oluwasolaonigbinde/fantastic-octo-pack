"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { agentEarningsTrend } from "../mockdata";

interface AgentEarningsChartProps {
  data: typeof agentEarningsTrend;
  year?: number;
}

function formatNaira(value: number) {
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
  return `₦${value}`;
}

export function AgentEarningsChart({
  data,
  year = 2025,
}: AgentEarningsChartProps) {
  return (
    <div className="rounded-xl border border-[#DDE0E5] bg-white p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[#111827]">Earnings Trend</p>
          <p className="text-sm text-[#374151]">Monthly earnings</p>
        </div>
        <span className="rounded-xl border border-[#DDE0E5] px-5 py-3 text-sm text-[#374151]">
          {year}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="agentEarningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FE6E00" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#FE6E00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 14, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatNaira}
            tick={{ fontSize: 14, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
            width={48}
            domain={[0, 400000]}
            ticks={[0, 100000, 200000, 300000, 400000]}
          />
          <Tooltip
            formatter={(v) => [
              `₦${(Number(v) || 0).toLocaleString()}`,
              "Earnings",
            ]}
            contentStyle={{
              fontSize: 12,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FE6E00"
            fill="url(#agentEarningsFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#FE6E00" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
