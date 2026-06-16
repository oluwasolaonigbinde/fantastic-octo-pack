"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PieChartComponentProps {
  data?: { name: string; value: number; color: string }[];
}

export default function PieChartComponent({data}: PieChartComponentProps) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          {/* Tooltip */}
          <Tooltip
            formatter={(value, name) => [`${value}`, name]}
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
