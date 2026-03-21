'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Droplets, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RegionSummary, RiskLevel } from '@/lib/aquasdg/types';
import { StaticMap } from '@/components/ui/map';

interface WorldMapProps {
  regions: RegionSummary[];
  onRegionSelect: (region: RegionSummary) => void;
  selectedRegionId?: string;
}

const riskColors: Record<RiskLevel, { bg: string; border: string; text: string }> = {
  critical: { 
    bg: 'fill-rose-500/80 hover:fill-rose-500', 
    border: 'stroke-rose-400',
    text: 'bg-rose-500' 
  },
  high: { 
    bg: 'fill-amber-500/80 hover:fill-amber-500', 
    border: 'stroke-amber-400',
    text: 'bg-amber-500' 
  },
  moderate: { 
    bg: 'fill-yellow-500/80 hover:fill-yellow-500', 
    border: 'stroke-yellow-400',
    text: 'bg-yellow-500' 
  },
  low: { 
    bg: 'fill-emerald-500/80 hover:fill-emerald-500', 
    border: 'stroke-emerald-400',
    text: 'bg-emerald-500' 
  },
};

export function WorldMap({ regions, onRegionSelect, selectedRegionId }: WorldMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionSummary | null>(null);

  // Group regions by risk level for legend
  const riskCounts = useMemo(() => {
    return regions.reduce((acc, r) => {
      acc[r.risk_level] = (acc[r.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<RiskLevel, number>);
  }, [regions]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Global Water Risk Map</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            {(['critical', 'high', 'moderate', 'low'] as RiskLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${riskColors[level].text}`} />
                <span className="capitalize hidden sm:inline">{level}</span>
                <span className="text-muted-foreground">({riskCounts[level] || 0})</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-b-lg overflow-hidden">
          <StaticMap 
            center={[15, 20]} // Roughly over North Africa/Middle East
            zoom={2.5}
            markers={regions.map(r => {
              const colors = riskColors[r.risk_level];
              const hexColors = {
                 critical: '#ef4444',
                 high: '#f59e0b',
                 moderate: '#eab308',
                 low: '#10b981'
              };
              
              const baseSize = 8;
              const populationScale = Math.log10(r.population / 100000 + 1) * 2;
              
              return {
                id: r.id,
                lat: r.coordinates.lat,
                lng: r.coordinates.lng,
                color: hexColors[r.risk_level],
                size: baseSize + populationScale,
                label: `<b>${r.name}</b><br/>${r.country}<br/>Risk: ${r.composite_risk_score.toFixed(0)}/100`
              };
            })}
            onMarkerClick={(id) => {
              const region = regions.find(r => r.id === id);
              if (region) onRegionSelect(region);
            }}
            className="w-full h-full"
          />

          {/* Selected Region Panel */}
          <AnimatePresence>
            {selectedRegionId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 z-10 w-64 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg"
              >
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="font-medium text-sm">Selected Region</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRegionSelect(null as any)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3">
                  {regions.filter(r => r.id === selectedRegionId).map(region => (
                    <div key={region.id} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-cyan-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm leading-tight">{region.name}</p>
                          <p className="text-xs text-muted-foreground">{region.country}</p>
                        </div>
                      </div>
                      
                      <Badge className={`${riskColors[region.risk_level].text} text-white capitalize w-full justify-center`}>
                        {region.risk_level} Risk ({region.composite_risk_score.toFixed(0)}/100)
                      </Badge>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Population</span>
                          <span className="font-medium">{(region.population / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Water Access</span>
                          <span className="font-medium">{region.water_access_pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
