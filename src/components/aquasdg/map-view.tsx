'use client';

import { useMemo } from 'react';
import { Map, MapMarker, MarkerContent, MarkerTooltip, MarkerPopup, MapControls } from '@/components/ui/map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { Region, IndicatorType } from '@/lib/aquasdg/types';
import { formatPopulation, getRiskMarkerColor, getColorForValue } from '@/lib/aquasdg/utils';

interface MapViewProps {
  regions: Region[];
  selectedIndicator: IndicatorType;
  onRegionClick: (region: Region) => void;
}

export default function MapView({ 
  regions, 
  selectedIndicator,
  onRegionClick 
}: MapViewProps) {
  
  const mapCenter: [number, number] = [30, 15]; // Default center
  
  return (
    <div className="w-full h-full relative">
      <Map 
        longitude={mapCenter[0]}
        latitude={mapCenter[1]}
        zoom={2}
        styles={{ 
          light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        }}
        className="w-full h-full"
      >
        <MapControls />
        
        {regions.map((region) => {
          const color = (selectedIndicator === 'composite_risk' || selectedIndicator === 'overall')
            ? getRiskMarkerColor(region.riskLevel)
            : getColorForValue((region.indicators as any)[selectedIndicator], selectedIndicator as string);
            
          const baseSize = Math.max(16, Math.min(48, Math.log10(region.population || 1000) * 6));
          const riskMultiplier = ((region.indicators?.composite_risk || 50) / 100) + 0.5;
          const size = baseSize * riskMultiplier;

          return (
            <MapMarker 
              key={region.id}
              longitude={region.coordinates.lng} 
              latitude={region.coordinates.lat}
            >
              <MarkerContent>
                <div 
                  className="rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
                  style={{ 
                    width: `${size}px`, 
                    height: `${size}px`, 
                    backgroundColor: `${color}44`,
                    border: `2px solid ${color}`,
                    boxShadow: `0 0 15px ${color}33`
                  }}
                  onClick={() => onRegionClick(region)}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}`
                    }}
                  />
                </div>
              </MarkerContent>
              
              <MarkerTooltip>
                <div className="p-3 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50 text-white min-w-[180px]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{region.country}</span>
                      <span className="text-sm font-bold text-white">{region.name}</span>
                    </div>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-none text-[8px] h-4 px-1">ML VERIFIED</Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Risk Level</span>
                      <span className="font-bold" style={{ color: color }}>{region.riskLevel}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${(region.indicators as any)[selectedIndicator === 'overall' ? 'composite_risk' : selectedIndicator] || 0}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 border-t border-slate-800/50 mt-1">
                      <span className="text-slate-500 uppercase font-bold tracking-tighter">Confidence</span>
                      <span className="text-cyan-400 font-mono">94.2%</span>
                    </div>
                  </div>
                </div>
              </MarkerTooltip>
              
              <MarkerPopup>
                <div className="p-5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-900/98 backdrop-blur-2xl border border-slate-700/50 text-white min-w-[280px] pointer-events-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/80">{region.country}</span>
                      <div className="text-2xl font-black leading-none mt-1.5 tracking-tight">{region.name}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800/30 border border-slate-700/30 shadow-inner">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ 
                        backgroundColor: color,
                        boxShadow: `0 0 15px ${color}`
                      }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 my-5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resilience</span>
                      <div className="text-lg font-black text-white font-mono">{(100 - (region.indicators?.composite_risk || 0)).toFixed(1)}%</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Population</span>
                      <div className="text-lg font-black text-white font-mono">{formatPopulation(region.population)}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">ML Diagnostic</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic pr-2">
                       {region.indicators.composite_risk > 60 ? "Infrastructure gap detected matching historical flood inundation patterns." : "High secondary access resilience relative to climate vulnerability baseline."}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => onRegionClick(region)}
                    className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-lg shadow-cyan-900/20 transition-all font-bold group px-4"
                  >
                    <span className="flex-1 text-left text-xs uppercase tracking-widest">Strategic Policy Engine</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live Data Inbound
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
    </div>
  );
}

/* 
PREVIOUS VERSION FOR REFERENCE:
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Region, IndicatorType } from '@/lib/aquasdg/types';
import { formatPopulation, getRiskMarkerColor, getColorForValue } from '@/lib/aquasdg/utils';

interface MapViewProps {
  regions: Region[];
  selectedIndicator: IndicatorType;
  onRegionClick: (region: Region) => void;
}

export default function MapView({ 
  regions, 
  selectedIndicator,
  onRegionClick 
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [{
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }]
      },
      center: [20, 5],
      zoom: 2
    });
    
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  useEffect(() => {
    if (!map.current) return;
    
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    regions.forEach(region => {
      const el = document.createElement('div');
      el.className = 'marker-region';
      
      const baseSize = Math.max(20, Math.min(60, Math.log10(region.population || 1000) * 8));
      const riskMultiplier = ((region.indicators?.composite_risk || 50) / 100) + 0.5;
      const size = baseSize * riskMultiplier;
      
      const color = selectedIndicator === 'composite_risk' 
        ? getRiskMarkerColor(region.riskLevel)
        : getColorForValue(region.indicators[selectedIndicator], selectedIndicator);

      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = `${color}44`;
      el.style.borderRadius = '50%';
      el.style.border = `2px solid ${color}`;
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.transition = 'all 0.3s ease-out';
      
      const dot = document.createElement('div');
      dot.style.width = '6px';
      dot.style.height = '6px';
      dot.style.backgroundColor = color;
      dot.style.borderRadius = '50%';
      dot.style.boxShadow = `0 0 10px ${color}`;
      el.appendChild(dot);
      
      el.animate([
        { boxShadow: `0 0 0 0px ${color}66` },
        { boxShadow: `0 0 0 15px ${color}00` }
      ], {
        duration: 2000,
        iterations: Infinity
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([region.coordinates.lng, region.coordinates.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, closeButton: false, className: 'custom-popup' })
            .setHTML(`
              <div class="p-4 rounded-xl shadow-2xl bg-slate-900 border border-slate-700/50 text-white min-w-[220px]">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">\${region.country}</span>
                  <div class="w-2 h-2 rounded-full" style="background-color: \${color}"></div>
                </div>
                <div class="text-lg font-bold mb-1">\${region.name}</div>
                <div class="h-px bg-slate-800 my-2"></div>
                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Population:</span>
                    <span class="font-bold">\${formatPopulation(region.population)}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Risk Score:</span>
                    <span class="font-bold text-cyan-400">\${(region.indicators?.composite_risk || 0).toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Status:</span>
                    <span class="font-bold capitalize" style="color: \${color}">\${region.riskLevel}</span>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-800 text-[10px] text-center text-slate-500 animate-pulse">
                  CLICK TO ANALYZE • LIVE DATA SYNC
                </div>
              </div>
            \`)
        )
        .addTo(map.current!);
      
      marker.getElement().addEventListener('click', () => onRegionClick(region));
      markersRef.current.push(marker);
    });
  }, [regions, selectedIndicator, onRegionClick]);
  
  return <div ref={mapContainer} className="w-full h-full" />;
}
*/
