"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  // Render markers ONLY when regions or layerMode changes (NOT selectedRegion)
  useEffect(() => {
    if (!mapRef.current || !mapReady || !regions.length) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Heatmap layer
    if (layerMode === "heatmap") {
      renderHeatmap(map, regions);
    } else {
      if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
      if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");
    }

    // Create markers
    regions.forEach((region) => {
      const color = riskColor(region.risk_level);
      const risk = region.indicators.composite_risk;
      const size = 8 + risk * 18;

      const el = document.createElement("div");
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${color}cc 0%, ${color}44 60%, transparent 100%);
        border: 1.5px solid ${color}aa;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 0 ${size * 0.8}px ${color}33;
      `;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.5)";
        el.style.boxShadow = `0 0 ${size * 2}px ${color}66`;
        el.style.zIndex = "10";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = `0 0 ${size * 0.8}px ${color}33`;
        el.style.zIndex = "auto";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedRegion(region);
      });

      // Use MapLibre's native popup — it positions correctly and doesn't jump
      const popup = new maplibregl.Popup({
        offset: [0, -(size / 2 + 4)],
        closeButton: false,
        closeOnClick: false,
        className: "aqua-tooltip",
        maxWidth: "260px",
      }).setHTML(buildTooltipHTML(region));

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([region.longitude, region.latitude])
        .addTo(map);

      // Show popup on hover, hide on leave
      el.addEventListener("mouseenter", () => {
        popup.setLngLat([region.longitude, region.latitude]).addTo(map);
      });
      el.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markersRef.current.push(marker);
    });
  }, [regions, layerMode, mapReady, setSelectedRegion]);

  // Highlight selected marker (update style without recreating)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    markersRef.current.forEach((marker, i) => {
      const region = regions[i];
      if (!region) return;
      const el = marker.getElement();
      const color = riskColor(region.risk_level);
      const isSelected = selectedRegion?.id === region.id;

      if (isSelected) {
        el.style.border = `2.5px solid ${color}`;
        el.style.boxShadow = `0 0 20px ${color}88, 0 0 40px ${color}44`;
        el.style.zIndex = "20";
      } else {
        el.style.border = `1.5px solid ${color}aa`;
        el.style.boxShadow = `0 0 ${(8 + region.indicators.composite_risk * 18) * 0.8}px ${color}33`;
        el.style.zIndex = "auto";
      }
    });
  }, [selectedRegion, regions, mapReady]);

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

function buildTooltipHTML(region: Region): string {
  const color = riskColor(region.risk_level);
  const ind = region.indicators;
  return `
    <div style="background:#111620;border:1px solid #1c2433;border-radius:6px;padding:10px 12px;font-family:system-ui,-apple-system,sans-serif;font-size:10px;color:#e2e8f0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-weight:600;font-size:11px;">${region.name}</span>
        <span style="color:${color};font-size:9px;font-weight:700;text-transform:uppercase;padding:1px 5px;border-radius:3px;background:${color}22;border:1px solid ${color}44;">${region.risk_level}</span>
      </div>
      <div style="color:#64748b;margin-bottom:8px;">${region.country} · ${formatNumber(region.population)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
        <div><div style="color:#64748b;font-size:8px;">Risk</div><div style="font-family:monospace;color:${color};font-weight:600;">${(ind.composite_risk * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Access</div><div style="font-family:monospace;">${ind.water_access_pct.toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Stress</div><div style="font-family:monospace;">${(ind.water_stress * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">Precip</div><div style="font-family:monospace;">${ind.precipitation_mm.toFixed(0)}mm</div></div>
        <div><div style="color:#64748b;font-size:8px;">Flood</div><div style="font-family:monospace;">${(ind.flood_risk * 100).toFixed(0)}%</div></div>
        <div><div style="color:#64748b;font-size:8px;">GW</div><div style="font-family:monospace;">${(ind.groundwater_potential * 100).toFixed(0)}%</div></div>
      </div>
      <div style="margin-top:6px;font-size:8px;color:#06b6d4;">Click to explore →</div>
    </div>
  `;
}

function renderHeatmap(map: maplibregl.Map, regions: Region[]) {
  if (map.getSource("heatmap-source")) return;

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: regions.map((r) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      },
      properties: {
        weight: r.indicators.water_stress * r.population / 1_000_000,
      },
    })),
  };

  map.addSource("heatmap-source", { type: "geojson", data: geojson });
  map.addLayer({
    id: "heatmap-layer",
    type: "heatmap",
    source: "heatmap-source",
    paint: {
      "heatmap-weight": ["get", "weight"],
      "heatmap-intensity": 1.5,
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
