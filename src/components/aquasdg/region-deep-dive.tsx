"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingDown, TrendingUp, Droplets, CloudRain, Waves, AlertTriangle, DollarSign, Loader2, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Region } from '@/lib/aquasdg/types';
import { formatPopulation, RISK_LEVEL_CONFIG } from '@/lib/aquasdg/utils';
import { cn } from '@/lib/utils';

interface EnrichedData {
  enriched?: {
    satellite?: { waterChangePercent10yr: number; surfaceWaterExtentKm2: number; permanentWaterKm2: number; seasonalWaterKm2: number } | null;
    precipitation?: { annualPrecipitationMm: number; trend10yr: number; droughtMonths: number } | null;
    floods?: { historicalEvents: { id: string; date: string; severity: string; affectedPeople: number; description: string }[]; avgEventsPerYear: number; lastMajorFlood: string | null } | null;
    infrastructure?: { totalWaterPoints: number; peoplePerWaterPoint: number; coverageRating: string; wells: number; drinkingWaterTaps: number } | null;
  };
  computed?: {
    risk_level: string;
    composite_risk_score: number;
    risk_factors: { factor: string; score: number; weight: number }[];
    recommendation: string;
  };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-700/50 rounded", className)} />;
}

function Section({ title, source, children, loading }: { title: string; source?: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="py-4 border-b border-slate-800/50 last:border-0">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : children}
      {source && <p className="text-xs text-slate-600 mt-2">Source: {source}</p>}
    </div>
  );
}

function CoverageColor({ ratio }: { ratio: number }) {
  const color = ratio > 10000 ? 'text-rose-400' : ratio > 2000 ? 'text-amber-400' : 'text-emerald-400';
  return <span className={cn("font-bold", color)}>{ratio.toLocaleString()}</span>;
}

export function RegionDeepDive({ region, onClose }: { region: Region; onClose: () => void }) {
  const [data, setData] = useState<EnrichedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/regions/${region.id}?enriched=true`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [region.id]);

  const sat = data?.enriched?.satellite;
  const precip = data?.enriched?.precipitation;
  const floods = data?.enriched?.floods;
  const infra = data?.enriched?.infrastructure;
  const computed = data?.computed;
  const riskConfig = RISK_LEVEL_CONFIG[region.riskLevel] || RISK_LEVEL_CONFIG['warning'];

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 bottom-0 w-[400px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">{region.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn(riskConfig.bgColor, riskConfig.borderColor, riskConfig.textColor)}>
              {riskConfig.label}
            </Badge>
            <span className="text-sm text-slate-400">{region.country}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Pop. {formatPopulation(region.population)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4">
          {error && !loading && (
            <div className="py-6 text-center text-sm text-slate-500">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
              Enriched data unavailable. Showing base metrics.
            </div>
          )}

          {/* Satellite Section */}
          <Section title="Satellite Water Detection" source={sat ? "JRC Global Surface Water" : undefined} loading={loading}>
            {sat ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {sat.waterChangePercent10yr < 0 ? <TrendingDown className="w-4 h-4 text-rose-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />}
                  <span className="text-sm text-slate-200">
                    Surface water change: <span className={sat.waterChangePercent10yr < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {sat.waterChangePercent10yr > 0 ? '+' : ''}{sat.waterChangePercent10yr.toFixed(1)}%
                    </span> over 10 years
                  </span>
                </div>
                {precip && (
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-200">
                      Rainfall {precip.trend10yr < 0 ? 'declining' : 'increasing'} at{' '}
                      <span className={precip.trend10yr < 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                        {precip.trend10yr > 0 ? '+' : ''}{precip.trend10yr.toFixed(0)}mm/year
                      </span>
                    </span>
                  </div>
                )}
                {precip && (
                  <p className="text-xs text-slate-500">Annual precipitation: {precip.annualPrecipitationMm.toFixed(0)}mm • {precip.droughtMonths} dry months/year</p>
                )}
              </div>
            ) : !loading && <p className="text-sm text-slate-500">Data unavailable</p>}
          </Section>

          {/* Infrastructure Section */}
          <Section title="Water Infrastructure" source={infra ? "OpenStreetMap" : undefined} loading={loading}>
            {infra ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-200">
                    {infra.totalWaterPoints} water points serving {formatPopulation(region.population)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-200">
                    <CoverageColor ratio={infra.peoplePerWaterPoint} /> people per water point
                  </span>
                </div>
                <Badge variant="outline" className={cn("text-xs capitalize",
                  infra.coverageRating === 'adequate' ? 'border-emerald-500/50 text-emerald-400' :
                  infra.coverageRating === 'strained' ? 'border-amber-500/50 text-amber-400' :
                  'border-rose-500/50 text-rose-400'
                )}>
                  {infra.coverageRating.replace('_', ' ')}
                </Badge>
              </div>
            ) : !loading && <p className="text-sm text-slate-500">Data unavailable</p>}
          </Section>

          {/* Flood History Section */}
          <Section title="Flood History" source={floods ? "GDACS (UN/EU)" : undefined} loading={loading}>
            {floods ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-200">
                  <span className="font-bold text-white">{floods.historicalEvents.length}</span> flood events recorded
                  {floods.avgEventsPerYear > 0 && <span className="text-slate-400"> (~{floods.avgEventsPerYear.toFixed(1)}/year)</span>}
                </p>
                {floods.lastMajorFlood && (
                  <p className="text-sm text-slate-300">Last major flood: <span className="text-amber-400">{new Date(floods.lastMajorFlood).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></p>
                )}
                {floods.historicalEvents.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {floods.historicalEvents.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-800/40">
                        <span className="text-slate-400">{new Date(e.date).toLocaleDateString()}</span>
                        <Badge variant="outline" className="text-[10px] h-4 border-slate-600 capitalize">{e.severity}</Badge>
                        {e.affectedPeople > 0 && <span className="text-slate-500">{(e.affectedPeople / 1000).toFixed(0)}K affected</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !loading && <p className="text-sm text-slate-500">Data unavailable</p>}
          </Section>

          {/* Risk Assessment */}
          <Section title="Risk Assessment" loading={loading}>
            {computed ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Composite Risk Score</span>
                  <span className="text-lg font-bold text-white">{computed.composite_risk_score.toFixed(1)}%</span>
                </div>
                <div className="space-y-1.5">
                  {computed.risk_factors?.slice(0, 4).map((f) => (
                    <div key={f.factor} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{f.factor.replace(/_/g, ' ')}</span>
                        <span className="text-slate-300">{f.score.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(f.score, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {computed.recommendation && (
                  <p className="text-xs text-slate-400 italic mt-2 p-2 bg-slate-800/30 rounded">{computed.recommendation}</p>
                )}
              </div>
            ) : !loading && <p className="text-sm text-slate-500">Data unavailable</p>}
          </Section>

          {/* Investment Opportunity */}
          <Section title="Investment Opportunity" loading={loading}>
            {infra && computed ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-200 font-medium">
                      {infra.coverageRating === 'severely_lacking' || infra.coverageRating === 'critical'
                        ? 'Borehole drilling program'
                        : 'Water point rehabilitation'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {infra.coverageRating === 'severely_lacking'
                        ? '$15K–50K per borehole serving 500–2,000 people'
                        : '$5K–15K per rehabilitation serving 200–800 people'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Estimated {Math.ceil(region.population / 2000 - infra.totalWaterPoints)} additional water points needed for adequate coverage.
                </p>
              </div>
            ) : !loading && <p className="text-sm text-slate-500">Data unavailable</p>}
          </Section>
        </div>
      </ScrollArea>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 pointer-events-none">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      )}
    </motion.div>
  );
}
