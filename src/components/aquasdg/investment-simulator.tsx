'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, TrendingUp, Users, DollarSign, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Region } from '@/lib/aquasdg/types';
import { formatPopulation, formatCurrency } from '@/lib/aquasdg/utils';

interface SimulationResult {
  totalBudget: number;
  timeHorizonYears: number;
  priority: string;
  allocations: {
    regionId: string;
    regionName: string;
    country: string;
    interventionType: string;
    interventionName: string;
    allocatedBudget: number;
    populationServed: number;
    costPerPerson: number;
    suitabilityScore: number;
  }[];
  summary: {
    totalPopulationServed: number;
    averageCostPerPerson: number;
    regionsServed: number;
    sustainabilityScore: number;
    projectedAccessImprovement: number;
  };
}

export function InvestmentSimulator({ regions }: { regions: Region[] }) {
  const [budget, setBudget] = useState(50_000_000);
  const [priority, setPriority] = useState<string>('max_people');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRegion = (id: string) => {
    setSelectedRegions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_budget: budget,
          time_horizon_years: 5,
          target_regions: selectedRegions.length > 0 ? selectedRegions : regions.slice(0, 10).map(r => r.id),
          priority,
          include_maintenance: true,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error('Simulation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
      <div className="p-4 border-b border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Investment Simulator</h2>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">5-Year Horizon</Badge>
        </div>

        {/* Budget Slider */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Budget</span>
            <span className="text-white font-mono font-bold">{formatCurrency(budget)}</span>
          </div>
          <input
            type="range" min={1_000_000} max={500_000_000} step={1_000_000}
            value={budget} onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>$1M</span><span>$500M</span>
          </div>
        </div>

        {/* Priority */}
        <div className="flex gap-2">
          {[
            { id: 'max_people', label: 'Max People' },
            { id: 'cost_efficiency', label: 'Cost Efficiency' },
            { id: 'sustainability', label: 'Sustainability' },
          ].map(p => (
            <Button key={p.id} size="sm" variant={priority === p.id ? 'default' : 'outline'}
              onClick={() => setPriority(p.id)}
              className={priority === p.id ? 'bg-cyan-600 hover:bg-cyan-500' : 'border-slate-700 text-slate-400'}
            >{p.label}</Button>
          ))}
        </div>

        {/* Region Selection */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Target Regions</span>
            <span className="text-xs text-slate-500">{selectedRegions.length || 'All top 10'} selected</span>
          </div>
          <ScrollArea className="h-28 border border-slate-800 rounded-lg p-2">
            <div className="grid grid-cols-2 gap-1">
              {regions.slice(0, 20).map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white p-1 rounded">
                  <input type="checkbox" checked={selectedRegions.includes(r.id)}
                    onChange={() => toggleRegion(r.id)} className="accent-cyan-500 w-3 h-3" />
                  <span className="truncate">{r.name}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Button onClick={runSimulation} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
          Run Simulation
        </Button>
      </div>

      {/* Results */}
      {result && (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-3 text-center">
                  <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">{formatPopulation(result.summary.totalPopulationServed)}</div>
                  <div className="text-xs text-slate-500">People Served</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">${result.summary.averageCostPerPerson.toFixed(0)}</div>
                  <div className="text-xs text-slate-500">Cost/Person</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-3 text-center">
                  <Globe className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">{result.summary.regionsServed}</div>
                  <div className="text-xs text-slate-500">Regions</div>
                </CardContent>
              </Card>
            </div>

            {/* Allocation Table */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Allocation Plan</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="text-left p-2 pl-4">Region</th>
                        <th className="text-left p-2">Intervention</th>
                        <th className="text-right p-2">Budget</th>
                        <th className="text-right p-2 pr-4">Served</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.allocations.map((a, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-2 pl-4 text-slate-300 font-medium">{a.regionName}</td>
                          <td className="p-2 text-slate-400">{a.interventionName}</td>
                          <td className="p-2 text-right text-emerald-400 font-mono">{formatCurrency(a.allocatedBudget)}</td>
                          <td className="p-2 pr-4 text-right text-white font-mono">{formatPopulation(a.populationServed)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Budget Allocation Chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Budget Allocation by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(150, result.allocations.length * 32)}>
                  <BarChart
                    layout="vertical"
                    data={result.allocations.map(a => ({
                      name: a.regionName,
                      budget: +(a.allocatedBudget / 1e6).toFixed(1),
                    }))}
                    margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} unit="M" />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      labelStyle={{ color: '#f1f5f9' }}
                      formatter={(v: number) => [`$${v}M`, 'Budget']}
                    />
                    <Bar dataKey="budget" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
