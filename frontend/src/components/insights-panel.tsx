"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type Region } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { formatNumber } from "@/lib/utils";

const SUGGESTED_QUERIES = [
  "Which 5 regions should get priority for $20M borehole investment?",
  "Compare flood vs drought risk across South Asian regions",
  "What shared interventions could serve the Sahel corridor?",
  "Rank countries by cost-effectiveness of piped water extension",
];

export function InsightsPanel({ regions }: { regions: Region[] }) {
  const [query, setQuery] = useState("");
  const { selectedRegion } = useAppStore();

  const mutation = useMutation({
    mutationFn: (q: string) => api.askAgent(q, selectedRegion?.id),
  });

  const handleAsk = (q: string) => {
    setQuery(q);
    mutation.mutate(q);
  };

  const derivedInsights = generateInsights(regions);

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-accent-purple" />
          {selectedRegion ? `Agent: ${selectedRegion.name}` : "AI Research Agent"}
        </span>
        <span className="text-[8px] text-accent-purple">Gemini</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mutation.data ? (
          <div className="p-2 space-y-1.5">
            <div className="text-[9px] text-text-muted font-mono mb-1">
              Q: {query}
            </div>
            <div className="text-[10px] text-text-primary leading-relaxed whitespace-pre-wrap">
              {mutation.data.answer}
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-bg-tertiary border border-border text-text-muted">
                confidence: {mutation.data.confidence}
              </span>
              {mutation.data.data_used.map((d, i) => (
                <span
                  key={i}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        ) : mutation.isPending ? (
          <div className="p-2 text-[10px] text-text-muted">
            Analyzing {regions.length} regions across {new Set(regions.map(r => r.country)).size} countries...
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {derivedInsights.slice(0, 3).map((ins, i) => (
              <div key={i} className="flex gap-1.5 text-[9px]">
                <span
                  className="shrink-0 w-0.5 rounded-full self-stretch"
                  style={{ background: ins.color }}
                />
                <span className="text-text-secondary">{ins.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Query input */}
      <div className="border-t border-border p-1.5">
        {!mutation.data && !mutation.isPending ? (
          <div className="flex gap-1 flex-wrap mb-1">
            {SUGGESTED_QUERIES.slice(0, 2).map((q, i) => (
              <button
                key={i}
                onClick={() => handleAsk(q)}
                className="text-[8px] px-1.5 py-0.5 rounded border border-border text-text-muted hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors truncate max-w-[180px]"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query && handleAsk(query)}
            placeholder={selectedRegion ? `Ask about ${selectedRegion.name}...` : "Ask the agent..."}
            className="flex-1 bg-bg-tertiary border border-border rounded px-2 py-1 text-[9px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <button
            onClick={() => query && handleAsk(query)}
            disabled={!query || mutation.isPending}
            className="px-2 py-1 rounded bg-accent-purple/20 text-accent-purple border border-accent-purple/30 text-[9px] font-medium disabled:opacity-30"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

function generateInsights(regions: Region[]) {
  const insights: { text: string; color: string }[] = [];

  const critical = regions.filter(r => r.risk_level === "critical" || r.risk_level === "high");
  const critPop = critical.reduce((s, r) => s + r.population, 0);
  insights.push({
    text: `${critical.length} regions in crisis (${formatNumber(critPop)} people) — ask agent for priority allocation`,
    color: "#ef4444",
  });

  const dualHazard = regions.filter(r => r.indicators.flood_risk > 0.4 && r.indicators.drought_risk > 0.5);
  if (dualHazard.length > 0) {
    insights.push({
      text: `${dualHazard.length} regions with flood+drought duality — MAR could convert surplus to buffer`,
      color: "#8b5cf6",
    });
  }

  const arid = regions.filter(r => r.indicators.precipitation_mm < 300);
  insights.push({
    text: `${arid.length} hyper-arid regions (<300mm/yr) need non-conventional supply`,
    color: "#f59e0b",
  });

  return insights;
}
