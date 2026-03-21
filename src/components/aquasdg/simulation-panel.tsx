'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Loader2, 
  DollarSign, 
  Clock, 
  Target, 
  TrendingUp,
  Users,
  Droplets,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { SimulationResult, RegionSummary } from '@/lib/aquasdg/types';

interface SimulationPanelProps {
  regions: RegionSummary[];
  onRunSimulation: (params: {
    budget: number;
    timeHorizon: number;
    regions: string[];
    priority: string;
  }) => Promise<SimulationResult | null>;
  result: SimulationResult | null;
  isLoading: boolean;
}

export function SimulationPanel({ regions, onRunSimulation, result, isLoading }: SimulationPanelProps) {
  const [budget, setBudget] = useState(10000000); // $10M default
  const [timeHorizon, setTimeHorizon] = useState(3);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [priority, setPriority] = useState('population');

  const handleRunSimulation = async () => {
    const targetRegions = selectedRegions.length > 0 
      ? selectedRegions 
      : regions.slice(0, 10).map(r => r.id);
    
    await onRunSimulation({
      budget,
      timeHorizon,
      regions: targetRegions,
      priority,
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-500" />
            Budget Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Budget
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1"
                min={100000}
                max={1000000000}
              />
              <span className="text-sm text-muted-foreground w-16">
                {formatCurrency(budget)}
              </span>
            </div>
          </div>

          {/* Time Horizon Slider */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Time Horizon: {timeHorizon} year{timeHorizon !== 1 ? 's' : ''}
            </Label>
            <Slider
              value={[timeHorizon]}
              onValueChange={([v]) => setTimeHorizon(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 year</span>
              <span>5 years</span>
              <span>10 years</span>
            </div>
          </div>

          {/* Optimization Priority */}
          <div className="space-y-2">
            <Label>Optimization Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="population">Maximize Population Served</SelectItem>
                <SelectItem value="cost_effectiveness">Cost Effectiveness</SelectItem>
                <SelectItem value="sustainability">Long-term Sustainability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Region Selection */}
          <div className="space-y-2">
            <Label>Target Regions ({selectedRegions.length} selected)</Label>
            <Select
              value={selectedRegions[0] || 'auto'}
              onValueChange={(v) => {
                if (v === 'auto') {
                  setSelectedRegions([]);
                } else {
                  setSelectedRegions([v]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-select top risk regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-select (Top 10 by Risk)</SelectItem>
                {regions.slice(0, 20).map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}, {r.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Run Button */}
          <Button 
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            onClick={handleRunSimulation}
            disabled={isLoading || budget < 100000}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Separator />
                
                <div className="text-sm font-medium">Simulation Results</div>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Population Served</span>
                    </div>
                    <p className="text-lg font-bold mt-1">
                      {(result.total_population_served / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Cost per Person</span>
                    </div>
                    <p className="text-lg font-bold mt-1">
                      ${result.total_cost_per_person.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Water Access Improvement</span>
                    <span className="font-medium">{result.impact_metrics.water_access_improvement_pct.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.impact_metrics.water_access_improvement_pct} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sustainability Score</span>
                    <span className="font-medium">{(result.overall_sustainability_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={result.overall_sustainability_score * 100} className="h-2" />
                </div>

                {/* Budget Breakdown */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Budget Allocation</div>
                  {Object.entries(result.budget_breakdown).slice(0, 4).map(([type, amount]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{type.replace(/_/g, ' ')}</span>
                      <span>{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>

                {/* Top Allocations */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Allocations</div>
                  <div className="space-y-1">
                    {result.allocations.slice(0, 3).map((alloc, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="truncate flex-1">{alloc.region_name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(alloc.allocated_budget)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
