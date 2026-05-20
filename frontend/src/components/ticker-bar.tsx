"use client";

import type { Region } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export function TickerBar({ regions }: { regions: Region[] }) {
  const critical = regions.filter((r) => r.risk_level === "critical").length;
  const high = regions.filter((r) => r.risk_level === "high").length;
  const totalPop = regions.reduce((s, r) => s + r.population, 0);
  const unserved = regions.reduce(
    (s, r) => s + Math.round(r.population * (1 - r.indicators.water_access_pct / 100)),
    0
  );
  const avgStress = regions.reduce((s, r) => s + r.indicators.water_stress, 0) / regions.length;
  const worstRegion = regions.sort((a, b) => b.indicators.composite_risk - a.indicators.composite_risk)[0];

  return (
    <div className="h-[28px] bg-bg-secondary border-b border-border flex items-center overflow-hidden">
      <div className="flex items-center gap-1 px-3 border-r border-border h-full shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-dot" />
        <span className="text-[10px] font-semibold text-accent-cyan tracking-wider">
          AQUASDG
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-6 px-4 whitespace-nowrap ticker-tape">
          <TickerItem label="REGIONS" value={`${regions.length}`} />
          <TickerItem label="POP. COVERED" value={formatNumber(totalPop)} />
          <TickerItem
            label="UNSERVED"
            value={formatNumber(unserved)}
            color="text-accent-red"
          />
          <TickerItem
            label="CRITICAL"
            value={`${critical}`}
            color="text-accent-red"
          />
          <TickerItem
            label="HIGH RISK"
            value={`${high}`}
            color="text-accent-amber"
          />
          <TickerItem
            label="AVG STRESS"
            value={`${(avgStress * 100).toFixed(1)}%`}
            color={avgStress > 0.6 ? "text-accent-red" : "text-accent-amber"}
          />
          <TickerItem
            label="WORST"
            value={worstRegion?.name || "—"}
            color="text-accent-red"
          />

          {/* Duplicate for seamless scroll */}
          <TickerItem label="REGIONS" value={`${regions.length}`} />
          <TickerItem label="POP. COVERED" value={formatNumber(totalPop)} />
          <TickerItem
            label="UNSERVED"
            value={formatNumber(unserved)}
            color="text-accent-red"
          />
          <TickerItem label="CRITICAL" value={`${critical}`} color="text-accent-red" />
          <TickerItem label="HIGH RISK" value={`${high}`} color="text-accent-amber" />
          <TickerItem
            label="AVG STRESS"
            value={`${(avgStress * 100).toFixed(1)}%`}
            color={avgStress > 0.6 ? "text-accent-red" : "text-accent-amber"}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 border-l border-border h-full shrink-0 text-[9px] text-text-muted">
        <span>World Bank</span>
        <span>INFORM</span>
        <span>Open-Meteo</span>
        <span>Gemini AI</span>
      </div>
    </div>
  );
}

function TickerItem({
  label,
  value,
  color = "text-text-primary",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[9px] text-text-muted">{label}</span>
      <span className={`text-[11px] font-mono font-medium ${color}`}>{value}</span>
    </span>
  );
}
