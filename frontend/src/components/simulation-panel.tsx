"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type SimulationResult } from "@/lib/api";
import { formatNumber, formatCurrency } from "@/lib/utils";

export function SimulationPanel() {
  const [budget, setBudget] = useState(25_000_000);
  const [priority, setPriority] = useState("equity");
  const [expanded, setExpanded] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      api.simulate({ budget_usd: budget, time_horizon_years: 5, priority }),
  });

  return (
    <div className="h-full flex flex-col">
      <div
        className="panel-header cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-accent-green">▶</span>
          Scenario Simulator
        </span>
        <span className="text-[9px] text-text-muted">
          {expanded ? "collapse" : "expand"}
        </span>
      </div>

      {expanded && (
        <div className="p-2 border-b border-border space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[8px] text-text-muted uppercase block mb-0.5">
                Budget
              </label>
              <input
                type="range"
                min={1_000_000}
                max={100_000_000}
                step={1_000_000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-1 accent-accent-cyan"
              />
              <div className="text-[10px] font-mono text-accent-cyan">
                {formatCurrency(budget)}
              </div>
            </div>
            <div className="w-24">
              <label className="text-[8px] text-text-muted uppercase block mb-0.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded px-1.5 py-0.5 text-[9px] text-text-primary"
              >
                <option value="equity">Equity</option>
                <option value="population">Max Pop.</option>
                <option value="cost_effectiveness">Cost Eff.</option>
                <option value="sustainability">Sustain.</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full text-[9px] py-1 rounded bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/30 font-medium disabled:opacity-50"
          >
            {mutation.isPending ? "Running..." : "Run Simulation"}
          </button>
        </div>
      )}

      {mutation.data && (
        <div className="flex-1 overflow-y-auto">
          <SimResults result={mutation.data} />
        </div>
      )}
    </div>
  );
}

function SimResults({ result }: { result: SimulationResult }) {
  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-4 border-b border-border">
        <MiniKPI label="Pop Served" value={formatNumber(result.total_population_served)} color="text-accent-cyan" />
        <MiniKPI label="Regions" value={`${result.regions_covered}`} />
        <MiniKPI label="$/Person" value={`$${result.cost_per_person_avg.toFixed(0)}`} />
        <MiniKPI label="SDG 6 Δ" value={`+${result.sdg6_progress_pct.toFixed(1)}%`} color="text-accent-green" />
      </div>

      {/* Allocations */}
      <div className="divide-y divide-border/50">
        {result.allocations.map((a, i) => (
          <div key={i} className="px-2 py-1 flex items-center justify-between">
            <div>
              <div className="text-[9px] text-text-primary font-medium truncate max-w-[160px]">
                {a.region_name}
              </div>
              <div className="text-[8px] text-text-muted">
                {a.intervention}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-accent-cyan">
                {formatCurrency(a.allocated_usd)}
              </div>
              <div className="text-[8px] font-mono text-text-muted">
                {formatNumber(a.population_impact)} ppl
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-1.5 py-1.5 border-r border-border last:border-r-0 text-center">
      <div className="text-[7px] text-text-muted uppercase">{label}</div>
      <div className={`font-mono text-[10px] font-semibold ${color || "text-text-primary"}`}>
        {value}
      </div>
    </div>
  );
}
