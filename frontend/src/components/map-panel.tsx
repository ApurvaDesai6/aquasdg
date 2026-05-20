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
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { setSelectedRegion, selectedRegion } = useAppStore();
  const [mapReady, setMapReady] = useState(false);

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

  // Render markers when map is ready and regions are loaded
  useEffect(() => {
    if (!mapRef.current || !mapReady || !regions.length) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (layerMode === "heatmap") {
      // Use GeoJSON circle layers for heatmap effect
      renderHeatmap(map, regions);
    } else {
      // Remove heatmap source if exists
      if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
      if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");
    }

    // Always add markers
    regions.forEach((region) => {
      const color = riskColor(region.risk_level);
      const risk = region.indicators.composite_risk;
      const baseSize = layerMode === "heatmap" ? 6 : 8 + risk * 18;

      const el = document.createElement("div");
      el.className = "aqua-marker";

      const isSelected = selectedRegion?.id === region.id;
      const size = isSelected ? baseSize * 1.4 : baseSize;

      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${color}cc 0%, ${color}44 60%, transparent 100%);
        border: ${isSelected ? "2px" : "1.5px"} solid ${color}${isSelected ? "ff" : "aa"};
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 0 ${size * 0.8}px ${color}33${isSelected ? `, 0 0 ${size * 2}px ${color}55` : ""};
      `;

      el.addEventListener("mouseenter", (e) => {
        el.style.transform = "scale(1.4)";
        el.style.boxShadow = `0 0 ${size * 1.5}px ${color}66`;
        setHoveredRegion(region);
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = `0 0 ${size * 0.8}px ${color}33`;
        setHoveredRegion(null);
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedRegion(region);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([region.longitude, region.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [regions, layerMode, mapReady, selectedRegion, setSelectedRegion]);

  // Fly to selected region
  useEffect(() => {
    if (!mapRef.current || !selectedRegion || !mapReady) return;
    mapRef.current.flyTo({
      center: [selectedRegion.longitude, selectedRegion.latitude],
      zoom: 5,
      duration: 1000,
    });
  }, [selectedRegion, mapReady]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className="h-full relative" onMouseMove={handleMouseMove}>
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

      {/* Stats overlay - top right */}
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

      {/* Custom tooltip */}
      {hoveredRegion && (
        <div
          className="fixed z-50 pointer-events-none panel rounded-md px-3 py-2 shadow-2xl"
          style={{ left: mousePos.x + 16, top: mousePos.y - 10, maxWidth: 260 }}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[11px] font-medium text-text-primary">
              {hoveredRegion.name}
            </span>
            <span
              className="text-[8px] px-1 py-0.5 rounded font-bold uppercase"
              style={{ color: riskColor(hoveredRegion.risk_level), background: `${riskColor(hoveredRegion.risk_level)}22` }}
            >
              {hoveredRegion.risk_level}
            </span>
          </div>
          <div className="text-[9px] text-text-muted mb-1.5">
            {hoveredRegion.country} · {formatNumber(hoveredRegion.population)}
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[9px]">
            <Stat label="Risk" value={`${(hoveredRegion.indicators.composite_risk * 100).toFixed(0)}%`} color={riskColor(hoveredRegion.risk_level)} />
            <Stat label="Access" value={`${hoveredRegion.indicators.water_access_pct.toFixed(0)}%`} />
            <Stat label="Stress" value={`${(hoveredRegion.indicators.water_stress * 100).toFixed(0)}%`} />
            <Stat label="Precip" value={`${hoveredRegion.indicators.precipitation_mm.toFixed(0)}mm`} />
            <Stat label="Flood" value={`${(hoveredRegion.indicators.flood_risk * 100).toFixed(0)}%`} />
            <Stat label="GW" value={`${(hoveredRegion.indicators.groundwater_potential * 100).toFixed(0)}%`} />
          </div>
          <div className="text-[8px] text-accent-cyan mt-1.5">Click to explore →</div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-text-muted text-[8px]">{label}</div>
      <div className="font-mono font-medium" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function renderHeatmap(map: maplibregl.Map, regions: Region[]) {
  if (map.getSource("heatmap-source")) return;

  const geojson = {
    type: "FeatureCollection" as const,
    features: regions.map((r) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
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
