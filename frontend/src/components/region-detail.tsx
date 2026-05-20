"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type NewsEvent } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { riskColor, formatNumber, formatCurrency } from "@/lib/utils";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export function RegionDetail() {
  const { selectedRegion, setSelectedRegion } = useAppStore();
  if (!selectedRegion) return null;

  const r = selectedRegion;
  const ind = r.indicators;
  const color = riskColor(r.risk_level);

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedRegion(null)}
            className="text-text-muted hover:text-text-primary"
          >
            ←
          </button>
          <span className="text-text-primary font-medium text-[11px] normal-case tracking-normal">
            {r.name}
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
          style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}
        >
          {r.risk_level}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-4 border-b border-border">
          <KPI label="Risk Score" value={`${(ind.composite_risk * 100).toFixed(0)}%`} color={color} />
          <KPI label="Water Access" value={`${ind.water_access_pct.toFixed(0)}%`} color={ind.water_access_pct < 30 ? "#ef4444" : undefined} />
          <KPI label="Population" value={formatNumber(r.population)} />
          <KPI label="Precip/yr" value={`${ind.precipitation_mm.toFixed(0)}mm`} />
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-3 border-b border-border">
          <MetricRow label="Water Stress" value={ind.water_stress} />
          <MetricRow label="Flood Risk" value={ind.flood_risk} />
          <MetricRow label="Drought Risk" value={ind.drought_risk} />
          <MetricRow label="Climate Vuln." value={ind.climate_vulnerability} />
          <MetricRow label="Infra Gap" value={ind.infrastructure_gap} />
          <MetricRow label="GW Potential" value={ind.groundwater_potential} positive />
        </div>

        {/* Radar */}
        <div className="h-[180px] border-b border-border p-2">
          <RadarView indicators={ind} />
        </div>

        {/* Recent Events */}
        <RegionNewsBlock regionId={r.id} />

        {/* Insights */}
        <InsightsBlock regionId={r.id} />

        {/* Interventions */}
        <InterventionsBlock regionId={r.id} />

        {/* Policy Brief */}
        <PolicyBlock regionId={r.id} />
      </div>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-2 py-2 border-r border-border last:border-r-0">
      <div className="text-[8px] text-text-muted uppercase">{label}</div>
      <div className="font-mono text-sm font-semibold" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const pct = value * 100;
  const barColor = positive
    ? pct > 50 ? "#10b981" : "#64748b"
    : pct > 70 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#06b6d4";

  return (
    <div className="px-2 py-1.5 border-r border-b border-border last:border-r-0">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-text-muted">{label}</span>
        <span className="font-mono text-[10px]" style={{ color: barColor }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 h-1 bg-bg-primary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function RadarView({ indicators }: { indicators: any }) {
  const data = [
    { axis: "Stress", v: indicators.water_stress * 100 },
    { axis: "Flood", v: indicators.flood_risk * 100 },
    { axis: "Drought", v: indicators.drought_risk * 100 },
    { axis: "Climate", v: indicators.climate_vulnerability * 100 },
    { axis: "Infra", v: indicators.infrastructure_gap * 100 },
    { axis: "GW", v: indicators.groundwater_potential * 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="#1c2433" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: "#64748b" }} />
        <Radar dataKey="v" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function InsightsBlock({ regionId }: { regionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["insights", regionId],
    queryFn: () => api.getInsights(regionId),
  });

  return (
    <div className="border-b border-border">
      <div className="panel-header">AI Analysis</div>
      <div className="p-2 space-y-1.5">
        {isLoading ? (
          <div className="text-[10px] text-text-muted">Analyzing...</div>
        ) : (
          data?.insights.map((ins, i) => (
            <div key={i} className="text-[10px] text-text-secondary leading-relaxed pl-2 border-l border-accent-cyan/30">
              {ins}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InterventionsBlock({ regionId }: { regionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["interventions", regionId],
    queryFn: () => api.getInterventions(regionId),
  });

  return (
    <div className="border-b border-border">
      <div className="panel-header">Recommended Interventions</div>
      <div className="divide-y divide-border/50">
        {isLoading ? (
          <div className="p-2 text-[10px] text-text-muted">Loading...</div>
        ) : (
          data?.interventions.map((rec, i) => (
            <div key={i} className="px-2 py-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium text-text-primary">{rec.name}</span>
                <span className="font-mono text-[9px] text-accent-cyan">
                  {(rec.suitability_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex gap-3 mt-0.5 text-[9px] text-text-muted font-mono">
                <span>{formatCurrency(rec.estimated_cost_usd)}</span>
                <span>{formatNumber(rec.population_served)} served</span>
                <span>sustain: {(rec.sustainability_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RegionNewsBlock({ regionId }: { regionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["region-news", regionId],
    queryFn: () => api.getRegionNews(regionId, 5),
    staleTime: 5 * 60 * 1000,
  });

  const typeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case "flood": return "#3b82f6";
      case "drought": return "#f59e0b";
      case "storm":
      case "cyclone": return "#8b5cf6";
      case "epidemic": return "#ef4444";
      default: return "#06b6d4";
    }
  };

  return (
    <div className="border-b border-border">
      <div className="panel-header">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-accent-blue live-dot" />
          Recent Events
        </span>
        <span className="text-[8px] text-accent-blue">ReliefWeb</span>
      </div>
      <div className="divide-y divide-border/30">
        {isLoading ? (
          <div className="p-2 text-[10px] text-text-muted">Fetching events...</div>
        ) : data?.events && data.events.length > 0 ? (
          data.events.slice(0, 5).map((event: NewsEvent) => (
            <div key={event.id} className="px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ background: typeColor(event.type) }}
                />
                <span
                  className="text-[8px] font-medium uppercase"
                  style={{ color: typeColor(event.type) }}
                >
                  {event.type}
                </span>
                <span className="text-[8px] text-text-muted ml-auto">
                  {event.date ? new Date(event.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                </span>
              </div>
              <div className="text-[9px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                {event.title}
              </div>
            </div>
          ))
        ) : (
          <div className="p-2 text-[10px] text-text-muted">No recent events found.</div>
        )}
      </div>
    </div>
  );
}

function PolicyBlock({ regionId }: { regionId: string }) {
  const mutation = useMutation({
    mutationFn: () => api.getPolicy(regionId, 5_000_000),
  });

  return (
    <div>
      <div className="panel-header">
        Policy Intelligence
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-[9px] px-2 py-0.5 rounded bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/30 disabled:opacity-50"
        >
          {mutation.isPending ? "Generating..." : "Generate Brief"}
        </button>
      </div>
      {mutation.data && (
        <div className="p-2 space-y-2">
          <div className="text-[10px] text-text-secondary leading-relaxed">
            {mutation.data.executive_summary}
          </div>
          <div className="space-y-1">
            <div className="text-[9px] text-text-muted uppercase font-medium">Priority Actions</div>
            {mutation.data.priority_actions.map((a, i) => (
              <div key={i} className="text-[10px] text-text-secondary flex gap-1.5">
                <span className="text-accent-cyan font-mono shrink-0">{i + 1}.</span>
                {a}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-[9px] text-text-muted uppercase font-medium">Risk Factors</div>
            {mutation.data.risk_factors.map((f, i) => (
              <div key={i} className="text-[10px] text-text-secondary pl-2 border-l border-accent-amber/30">
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
