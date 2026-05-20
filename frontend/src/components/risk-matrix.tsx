"use client";

import type { Region } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { riskColor } from "@/lib/utils";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

export function RiskMatrix({ regions }: { regions: Region[] }) {
  const { setSelectedRegion } = useAppStore();

  const data = regions.map((r) => ({
    x: r.indicators.water_stress * 100,
    y: r.indicators.infrastructure_gap * 100,
    name: r.name,
    country: r.country,
    risk: r.risk_level,
    region: r,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        Stress × Infrastructure Gap
        <span className="text-[9px] text-text-muted">click to select</span>
      </div>
      <div className="flex-1 p-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 28 }}>
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#64748b" }}
              label={{ value: "Water Stress %", position: "bottom", fontSize: 9, fill: "#64748b", offset: 2 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#64748b" }}
              label={{ value: "Infra Gap %", angle: -90, position: "left", fontSize: 9, fill: "#64748b", offset: 10 }}
            />
            <ReferenceLine x={60} stroke="#1c2433" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#1c2433" strokeDasharray="3 3" />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="panel rounded px-2 py-1.5 text-[10px]">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-text-muted">{d.country}</div>
                    <div className="mt-1 font-mono">
                      Stress: {d.x.toFixed(0)}% · Gap: {d.y.toFixed(0)}%
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              onClick={(d: any) => setSelectedRegion(d.region)}
              cursor="pointer"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={riskColor(d.risk)} fillOpacity={0.7} r={4} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
