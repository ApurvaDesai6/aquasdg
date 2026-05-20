"use client";

import { useState } from "react";
import type { Region } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { formatNumber, riskColor } from "@/lib/utils";

type SortKey = "name" | "risk" | "access" | "stress" | "population" | "precip";

export function RegionsTable({ regions }: { regions: Region[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const { setSelectedRegion, selectedRegion } = useAppStore();

  const sorted = [...regions].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "risk": cmp = a.indicators.composite_risk - b.indicators.composite_risk; break;
      case "access": cmp = a.indicators.water_access_pct - b.indicators.water_access_pct; break;
      case "stress": cmp = a.indicators.water_stress - b.indicators.water_stress; break;
      case "population": cmp = a.population - b.population; break;
      case "precip": cmp = a.indicators.precipitation_mm - b.indicators.precipitation_mm; break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        Regions Monitor
        <span className="text-text-secondary">{regions.length} regions</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-bg-panel z-10">
            <tr className="border-b border-border">
              <Th onClick={() => toggleSort("name")} active={sortKey === "name"}>Region</Th>
              <Th onClick={() => toggleSort("risk")} active={sortKey === "risk"} right>Risk</Th>
              <Th onClick={() => toggleSort("access")} active={sortKey === "access"} right>Access</Th>
              <Th onClick={() => toggleSort("stress")} active={sortKey === "stress"} right>Stress</Th>
              <Th onClick={() => toggleSort("precip")} active={sortKey === "precip"} right>Precip</Th>
              <Th onClick={() => toggleSort("population")} active={sortKey === "population"} right>Pop</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`border-b border-border/50 cursor-pointer transition-colors ${
                  selectedRegion?.id === r.id
                    ? "bg-accent-cyan/10"
                    : "hover:bg-bg-tertiary"
                }`}
              >
                <td className="px-2 py-1.5">
                  <div className="font-medium text-text-primary truncate max-w-[140px]">
                    {r.name}
                  </div>
                  <div className="text-[9px] text-text-muted">{r.country}</div>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <span
                    className="font-mono font-medium"
                    style={{ color: riskColor(r.risk_level) }}
                  >
                    {(r.indicators.composite_risk * 100).toFixed(0)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono">
                  <span className={r.indicators.water_access_pct < 30 ? "text-accent-red" : ""}>
                    {r.indicators.water_access_pct.toFixed(0)}%
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono">
                  <span className={r.indicators.water_stress > 0.7 ? "text-accent-red" : ""}>
                    {(r.indicators.water_stress * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">
                  {r.indicators.precipitation_mm.toFixed(0)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-text-secondary">
                  {formatNumber(r.population)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  right,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  right?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-2 py-1.5 cursor-pointer select-none font-medium ${
        right ? "text-right" : "text-left"
      } ${active ? "text-accent-cyan" : "text-text-muted"}`}
    >
      {children}
    </th>
  );
}
