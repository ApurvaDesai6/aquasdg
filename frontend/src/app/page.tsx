"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { TickerBar } from "@/components/ticker-bar";
import { MapPanel } from "@/components/map-panel";
import { RegionsTable } from "@/components/regions-table";
import { RiskMatrix } from "@/components/risk-matrix";
import { RegionDetail } from "@/components/region-detail";
import { SimulationPanel } from "@/components/simulation-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { CorrelationPanel } from "@/components/correlation-panel";

export default function Home() {
  const { data: regions, isLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
  });

  const { selectedRegion } = useAppStore();

  if (isLoading || !regions) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="text-accent-cyan font-mono text-sm mb-2">AQUASDG v3.0</div>
          <div className="text-text-muted text-[10px]">
            Ingesting live data from 5 sources across 15 countries...
          </div>
          <div className="mt-4 w-48 h-0.5 bg-bg-tertiary rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-accent-cyan rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      <TickerBar regions={regions} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map (main stage) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <MapPanel regions={regions} />
          </div>
          {/* Bottom analytics strip */}
          <div className="h-[180px] flex border-t border-border shrink-0">
            <div className="flex-1 border-r border-border">
              <RiskMatrix regions={regions} />
            </div>
            <div className="flex-1 border-r border-border">
              <CorrelationPanel regions={regions} />
            </div>
            <div className="flex-1">
              <InsightsPanel regions={regions} />
            </div>
          </div>
        </div>

        {/* Right sidebar: Region detail OR table + simulator */}
        <div className="w-[400px] flex flex-col border-l border-border shrink-0">
          {selectedRegion ? (
            <div className="flex-1 overflow-y-auto">
              <RegionDetail />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden min-h-0">
                <RegionsTable regions={regions} />
              </div>
              <div className="h-[220px] border-t border-border shrink-0">
                <SimulationPanel />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
