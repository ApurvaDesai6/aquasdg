"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Region } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { riskColor, formatNumber } from "@/lib/utils";

type LayerMode = "risk" | "heatmap" | "connections";

/**
 * Generate connection lines between high-risk regions and nearby water-rich regions.
 * This shows potential resource-sharing corridors.
 */
function buildConnectionsGeoJSON(regions: Region[]): GeoJSON.FeatureCollection {
  const highRisk = regions.filter(
    (r) => r.risk_level === "critical" || r.risk_level === "high"
  );
  const waterRich = regions.filter(
    (r) => r.indicators.groundwater_potential >= 0.5 || r.indicators.precipitation_mm > 1000
  );

  const features: GeoJSON.Feature[] = [];

  for (const source of highRisk) {
    // Find the 2 nearest water-rich regions (that aren't in the same city)
    const candidates = waterRich
      .filter((t) => t.id !== source.id)
      .map((t) => ({
        target: t,
        dist: Math.sqrt(
          Math.pow(source.latitude - t.latitude, 2) +
          Math.pow(source.longitude - t.longitude, 2)
        ),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);

    for (const { target, dist } of candidates) {
      // Only connect if within ~15 degrees (~1500km)
      if (dist > 15) continue;

      // Compute a "connection strength" based on how complementary the regions are
      const strength = Math.min(
        1,
        (source.indicators.composite_risk + target.indicators.groundwater_potential) / 2
      );

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [source.longitude, source.latitude],
            [target.longitude, target.latitude],
          ],
        },
        properties: {
          source_name: source.name,
          target_name: target.name,
          source_risk: source.risk_level,
          target_gw: target.indicators.groundwater_potential,
          strength,
          distance_deg: dist,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function MapPanel({ regions }: { regions: Region[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [layerMode, setLayerMode] = useState<LayerMode>("risk");
  const [mapReady, setMapReady] = useState(false);
  const { setSelectedRegion, selectedRegion } = useAppStore();

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
          },
        },
        layers: [{ id: "base", type: "raster", source: "carto-dark" }],
      },
      center: [50, 8],
      zoom: 2.8,
      minZoom: 2,
      maxZoom: 10,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    mapRef.current = map;
    map.on("load", () => setMapReady(true));

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Update layers when mode or regions change
  useEffect(() => {
    if (!mapRef.current || !mapReady || !regions.length) return;
    const map = mapRef.current;

    // Clean up old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove old layers/sources
    const layersToRemove = [
      "regions-circle", "regions-circle-stroke", "regions-labels",
      "heatmap-layer", "connections-lines", "connections-glow",
    ];
    for (const id of layersToRemove) {
      if (map.getLayer(id)) map.removeLayer(id);
    }
    const sourcesToRemove = ["regions-source", "heatmap-source", "connections-source"];
    for (const id of sourcesToRemove) {
      if (map.getSource(id)) map.removeSource(id);
    }

    // Build GeoJSON for regions
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: regions.map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [r.longitude, r.latitude],
        },
        properties: {
          id: r.id,
          name: r.name,
          country: r.country,
          population: r.population,
          risk_level: r.risk_level,
          composite_risk: r.indicators.composite_risk,
          water_access: r.indicators.water_access_pct,
          water_stress: r.indicators.water_stress,
          precipitation: r.indicators.precipitation_mm,
          flood_risk: r.indicators.flood_risk,
          groundwater: r.indicators.groundwater_potential,
          drought_risk: r.indicators.drought_risk,
          climate_vulnerability: r.indicators.climate_vulnerability,
        },
      })),
    };

    map.addSource("regions-source", { type: "geojson", data: geojson });

    // Heatmap mode
    if (layerMode === "heatmap") {
      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "regions-source",
        paint: {
          "heatmap-weight": ["get", "water_stress"],
          "heatmap-intensity": 2,
          "heatmap-radius": 50,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(6,182,212,0.3)",
            0.4, "rgba(59,130,246,0.5)",
            0.6, "rgba(139,92,246,0.6)",
            0.8, "rgba(239,68,68,0.7)",
            1, "rgba(239,68,68,0.9)",
          ],
          "heatmap-opacity": 0.7,
        },
      });
    }

    // Connections mode: draw arc lines
    if (layerMode === "connections") {
      const connectionsGeoJSON = buildConnectionsGeoJSON(regions);
      map.addSource("connections-source", { type: "geojson", data: connectionsGeoJSON });

      // Glow effect layer (wider, more transparent)
      map.addLayer({
        id: "connections-glow",
        type: "line",
        source: "connections-source",
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "strength"],
            0.3, "#06b6d4",
            0.5, "#8b5cf6",
            0.8, "#ef4444",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "strength"],
            0.3, 3,
            0.8, 6,
          ],
          "line-opacity": 0.15,
          "line-blur": 3,
        },
      });

      // Main connection lines
      map.addLayer({
        id: "connections-lines",
        type: "line",
        source: "connections-source",
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "strength"],
            0.3, "#06b6d4",
            0.5, "#8b5cf6",
            0.8, "#ef4444",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "strength"],
            0.3, 1,
            0.8, 2.5,
          ],
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["get", "strength"],
            0.3, 0.4,
            0.8, 0.8,
          ],
          "line-dasharray": [2, 2],
        },
      });
    }

    // Circle fill layer (always present)
    map.addLayer({
      id: "regions-circle",
      type: "circle",
      source: "regions-source",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "composite_risk"],
          0.3, 5,
          0.5, 8,
          0.7, 12,
          0.9, 16,
        ],
        "circle-color": [
          "match",
          ["get", "risk_level"],
          "critical", "#ef4444",
          "high", "#f59e0b",
          "moderate", "#06b6d4",
          "low", "#10b981",
          "#64748b",
        ],
        "circle-opacity": layerMode === "connections" ? 0.8 : 0.6,
        "circle-blur": layerMode === "connections" ? 0.1 : 0.3,
      },
    });

    // Circle stroke layer
    map.addLayer({
      id: "regions-circle-stroke",
      type: "circle",
      source: "regions-source",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "composite_risk"],
          0.3, 5,
          0.5, 8,
          0.7, 12,
          0.9, 16,
        ],
        "circle-color": "transparent",
        "circle-stroke-width": 1.5,
        "circle-stroke-color": [
          "match",
          ["get", "risk_level"],
          "critical", "#ef4444",
          "high", "#f59e0b",
          "moderate", "#06b6d4",
          "low", "#10b981",
          "#64748b",
        ],
        "circle-stroke-opacity": 0.9,
      },
    });

    // Labels for high/critical in risk mode
    if (layerMode === "risk") {
      map.addLayer({
        id: "regions-labels",
        type: "symbol",
        source: "regions-source",
        filter: ["in", ["get", "risk_level"], ["literal", ["critical", "high"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [1.2, 0],
          "text-anchor": "left",
          "text-max-width": 10,
        },
        paint: {
          "text-color": "#94a3b8",
          "text-halo-color": "#0b0e14",
          "text-halo-width": 1,
        },
      });
    }

    // Popup on click
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "320px",
      className: "aqua-tooltip",
    });

    map.on("click", "regions-circle", (e) => {
      if (!e.features || !e.features[0]) return;
      const props = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;

      // Select region in app state
      const region = regions.find((r) => r.id === props.id);
      if (region) setSelectedRegion(region);

      popup
        .setLngLat(coords as [number, number])
        .setHTML(buildTooltipHTML(props))
        .addTo(map);
    });

    // Cursor change on hover
    map.on("mouseenter", "regions-circle", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "regions-circle", () => {
      map.getCanvas().style.cursor = "";
    });

  }, [regions, layerMode, mapReady, setSelectedRegion]);

  // Fly to selected
  useEffect(() => {
    if (!mapRef.current || !selectedRegion || !mapReady) return;
    mapRef.current.flyTo({
      center: [selectedRegion.longitude, selectedRegion.latitude],
      zoom: 5,
      duration: 1000,
    });
  }, [selectedRegion, mapReady]);

  return (
    <div className="h-full relative">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Layer controls */}
      <div className="absolute top-2 left-2 z-20 panel rounded px-2 py-1.5">
        <div className="text-[8px] text-text-muted uppercase tracking-wider mb-1.5">
          Visualization
        </div>
        <div className="flex gap-1">
          {([
            { id: "risk" as const, label: "Risk Zones" },
            { id: "heatmap" as const, label: "Stress Density" },
            { id: "connections" as const, label: "Connections" },
          ]).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setLayerMode(mode.id)}
              className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
                layerMode === mode.id
                  ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[8px]">
          {(["critical", "high", "moderate", "low"] as const).map((level) => (
            <span key={level} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: riskColor(level) }}
              />
              <span className="text-text-muted capitalize">{level}</span>
              <span className="font-mono text-text-secondary">
                {regions.filter((r) => r.risk_level === level).length}
              </span>
            </span>
          ))}
        </div>
        {layerMode === "connections" && (
          <div className="mt-2 pt-1.5 border-t border-border/50">
            <div className="text-[8px] text-text-muted mb-1">Connection Strength</div>
            <div className="flex items-center gap-1">
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ef4444]" />
            </div>
            <div className="flex justify-between text-[7px] text-text-muted mt-0.5">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-2 right-12 z-20 panel rounded px-2 py-1.5 text-[9px]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-text-muted">Regions</span>
          <span className="font-mono text-right">{regions.length}</span>
          <span className="text-text-muted">Population</span>
          <span className="font-mono text-right">{formatNumber(regions.reduce((s, r) => s + r.population, 0))}</span>
          <span className="text-text-muted">Critical</span>
          <span className="font-mono text-right text-accent-red">{regions.filter(r => r.risk_level === "critical").length}</span>
          <span className="text-text-muted">High</span>
          <span className="font-mono text-right text-accent-amber">{regions.filter(r => r.risk_level === "high").length}</span>
        </div>
      </div>
    </div>
  );
}

function buildTooltipHTML(props: Record<string, any>): string {
  const color = riskColor(props.risk_level);

  // Build mini sparkbar for key metrics
  const metrics = [
    { label: "Water Stress", value: props.water_stress, color: props.water_stress > 0.7 ? "#ef4444" : props.water_stress > 0.5 ? "#f59e0b" : "#06b6d4" },
    { label: "Flood Risk", value: props.flood_risk, color: props.flood_risk > 0.6 ? "#ef4444" : props.flood_risk > 0.4 ? "#f59e0b" : "#06b6d4" },
    { label: "Drought", value: props.drought_risk, color: props.drought_risk > 0.6 ? "#ef4444" : props.drought_risk > 0.4 ? "#f59e0b" : "#06b6d4" },
    { label: "GW Potential", value: props.groundwater, color: props.groundwater > 0.5 ? "#10b981" : "#64748b" },
  ];

  const metricBars = metrics.map(m => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <span style="width:60px;font-size:8px;color:#64748b;">${m.label}</span>
      <div style="flex:1;height:4px;background:#1c2433;border-radius:2px;overflow:hidden;">
        <div style="width:${(m.value * 100).toFixed(0)}%;height:100%;background:${m.color};border-radius:2px;transition:width 0.3s;"></div>
      </div>
      <span style="font-family:monospace;font-size:8px;color:${m.color};width:28px;text-align:right;">${(m.value * 100).toFixed(0)}%</span>
    </div>
  `).join("");

  return `
    <div style="background:linear-gradient(135deg, #111620 0%, #0f1318 100%);border:1px solid #1c2433;border-radius:8px;padding:12px 14px;font-family:system-ui,-apple-system,sans-serif;font-size:10px;color:#e2e8f0;min-width:240px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div>
          <div style="font-weight:600;font-size:12px;letter-spacing:-0.01em;">${props.name}</div>
          <div style="color:#64748b;font-size:9px;margin-top:1px;">${props.country} · Pop. ${formatNumber(props.population)}</div>
        </div>
        <span style="color:${color};font-size:9px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:${color}15;border:1px solid ${color}40;letter-spacing:0.03em;">${props.risk_level}</span>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px;padding:6px 8px;background:#0b0e14;border-radius:5px;border:1px solid #1c243366;">
        <div style="text-align:center;flex:1;">
          <div style="font-family:monospace;font-size:16px;font-weight:700;color:${color};line-height:1.2;">${(props.composite_risk * 100).toFixed(0)}%</div>
          <div style="font-size:7px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Risk Score</div>
        </div>
        <div style="width:1px;background:#1c2433;"></div>
        <div style="text-align:center;flex:1;">
          <div style="font-family:monospace;font-size:16px;font-weight:700;color:${props.water_access < 40 ? '#ef4444' : '#06b6d4'};line-height:1.2;">${props.water_access.toFixed(0)}%</div>
          <div style="font-size:7px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Water Access</div>
        </div>
        <div style="width:1px;background:#1c2433;"></div>
        <div style="text-align:center;flex:1;">
          <div style="font-family:monospace;font-size:16px;font-weight:700;color:#94a3b8;line-height:1.2;">${props.precipitation.toFixed(0)}</div>
          <div style="font-size:7px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">mm/year</div>
        </div>
      </div>

      <div style="margin-top:2px;">
        ${metricBars}
      </div>

      <div style="margin-top:8px;padding-top:6px;border-top:1px solid #1c243366;display:flex;align-items:center;gap:4px;">
        <div style="width:4px;height:4px;border-radius:50%;background:#06b6d4;animation:blink 2s ease-in-out infinite;"></div>
        <span style="font-size:8px;color:#64748b;">Click for full analysis</span>
      </div>
    </div>
  `;
}
