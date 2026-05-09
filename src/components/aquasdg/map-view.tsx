'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Region, IndicatorType } from '@/lib/aquasdg/types';

interface MapViewProps {
  regions: Region[];
  selectedIndicator: IndicatorType;
  onRegionClick: (region: Region) => void;
}

export default function MapView({ regions, selectedIndicator, onRegionClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const regionsRef = useRef(regions);
  const callbackRef = useRef(onRegionClick);

  regionsRef.current = regions;
  callbackRef.current = onRegionClick;

  const buildGeoJSON = useCallback((data: Region[]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: data.map(r => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [r.coordinates.lng, r.coordinates.lat] },
      properties: {
        id: r.id,
        risk: r.indicators?.composite_risk || 0,
        population: r.population || 1000,
        name: r.name,
        country: r.country,
        riskLevel: r.riskLevel
      }
    }))
  }), []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [30, 15],
      zoom: 2
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('regions', { type: 'geojson', data: buildGeoJSON(regionsRef.current) });

      map.addLayer({
        id: 'regions-heat',
        type: 'heatmap',
        source: 'regions',
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'risk'], 0, 0, 100, 1],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, '#2dd4bf',
            0.4, '#fbbf24',
            0.6, '#f97316',
            0.8, '#ef4444',
            1, '#dc2626'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 40],
          'heatmap-opacity': 0.7
        }
      });

      map.addLayer({
        id: 'regions-circles',
        type: 'circle',
        source: 'regions',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'interpolate', ['linear'], ['get', 'risk'],
            0, '#2dd4bf', 30, '#fbbf24', 60, '#f97316', 80, '#ef4444', 100, '#dc2626'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#1e293b',
          'circle-opacity': 0.9
        }
      });

      map.on('click', 'regions-circles', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) {
          const region = regionsRef.current.find(r => r.id === id);
          if (region) callbackRef.current(region);
        }
      });

      map.on('mouseenter', 'regions-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'regions-circles', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [buildGeoJSON]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('regions') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(buildGeoJSON(regions));
  }, [regions, selectedIndicator, buildGeoJSON]);

  return <div ref={containerRef} className="w-full h-full" />;
}
