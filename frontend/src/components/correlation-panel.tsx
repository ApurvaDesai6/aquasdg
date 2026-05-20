"use client";

import type { Region } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function CorrelationPanel({ regions }: { regions: Region[] }) {
  const byCountry = Object.entries(
    regions.reduce<Record<string, { stress: number[]; access: number[]; pop: number }>>(
      (acc, r) => {
        if (!acc[r.country]) acc[r.country] = { stress: [], access: [], pop: 0 };
        acc[r.country].stress.push(r.indicators.water_stress);
        acc[r.country].access.push(r.indicators.water_access_pct);
        acc[r.country].pop += r.population;
        return acc;
      },
      {}
    )
  )
    .map(([country, data]) => ({
      country: country.slice(0, 8),
      avgStress: Math.round(
        (data.stress.reduce((a, b) => a + b, 0) / data.stress.length) * 100
      ),
      avgAccess: Math.round(
        data.access.reduce((a, b) => a + b, 0) / data.access.length
      ),
      unserved: Math.round(
        data.pop * (1 - data.access.reduce((a, b) => a + b, 0) / data.access.length / 100)
      ),
    }))
    .sort((a, b) => b.avgStress - a.avgStress)
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        Country Stress vs Access
        <span className="text-[9px] text-text-muted">avg by country</span>
      </div>
      <div className="flex-1 p-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={byCountry}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
          >
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: "#64748b" }} />
            <YAxis
              type="category"
              dataKey="country"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: "#111620",
                border: "1px solid #1c2433",
                borderRadius: 4,
                fontSize: 10,
              }}
            />
            <Bar dataKey="avgStress" fill="#ef4444" opacity={0.8} name="Stress %" radius={[0, 2, 2, 0]} barSize={8} />
            <Bar dataKey="avgAccess" fill="#06b6d4" opacity={0.8} name="Access %" radius={[0, 2, 2, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
