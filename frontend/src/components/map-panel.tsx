"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Region } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { riskColor, formatNumber } from "@/lib/utils";

type LayerMode = "risk" | "heatmap" | "clusters";

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

  // Use a GeoJSON source + circle layer instead of DOM markers
  // This avoids all the hover/positioning issues with HTML markers
  useEffect(() => {
    if (!mapRef.current || !mapReady || !regions.length) return;
    const map = mapRef.current;

    // Clean up old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove old layers/sources
    if (map.getLayer("regions-circle")) map.removeLayer("regions-circle");
    if (map.getLayer("regions-circle-stroke")) map.removeLayer("regions-circle-stroke");
    if (map.getLayer("regions-labels")) map.removeLayer("regions-labels");
    if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
    if (map.getSource("regions-source")) map.removeSource("regions-source");
    if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");

    // Build GeoJSON
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
        },
      })),
    };

    map.addSource("regions-source", { type: "geojson", data: geojson });

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

    // Circle fill layer
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
        "circle-opacity": 0.6,
        "circle-blur": 0.3,
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

    // Labels for high/critical
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
      maxWidth: "280px",
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
            { id: "clusters" as const, label: "Clusters" },
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
  return `
    <div style="background:#111620;border:1px solid #1c2433;border-radius:6px;padding:10px 12px;font-family:system-ui,-apple-system,sans-serif;font-size:10px;color:#e2e8f0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-weight:600;font-size:11px;">${props.name}</span>
        <span style="color:${color};font-size:9px;font-weight:700;text-transform:uppercase;padding:1px 5px;border-radius:3px;background:${color}22;border:1px solid ${color}44;">${props.risk_level}</span>
      </div>
      <div style="color:#64748b;margin-bottom:8px;">${props.country} · ${formatNumber(props.population)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
        <div><div style="color:#64748b;font-size:8px;">Risk</div><div style="font-family:monospace;color:${color};font-weight:600;">${(props.composite_risk * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Access</div><div style="font-family:monospace;">${props.water_access.toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Stress</div><div style="font-family:monospace;">${(props.water_stress * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Precip</div><div style="font-family:monospace;">${props.precipitation.toFixed(0)}mm</div></div>
        <div><div style="color:#64748b;font-size:8px;">Flood</div><div style="font-family:monospace;">${(props.flood_risk * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">GW</div><div style="font-family:monospace;">${(props.groundwater * 100).toFixed(0)}%</div></div>
      </div>
    </div>
  `;
}
