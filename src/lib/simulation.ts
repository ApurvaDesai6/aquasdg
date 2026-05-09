/**
 * Budget Simulation Engine (ported from Python simulation.py)
 * Optimizes allocation across interventions and calculates projected impact
 */

import { RegionData } from './data';
import { classifyRegion } from './classifier';
import { getRecommendations, COST_BENCHMARKS, InterventionType } from './interventions';

interface AllocationResult {
  regionId: string;
  regionName: string;
  country: string;
  interventionType: string;
  interventionName: string;
  allocatedBudget: number;
  populationServed: number;
  costPerPerson: number;
  suitabilityScore: number;
}

export interface SimulationResult {
  totalBudget: number;
  timeHorizonYears: number;
  priority: string;
  allocations: AllocationResult[];
  summary: {
    totalPopulationServed: number;
    averageCostPerPerson: number;
    regionsServed: number;
    sustainabilityScore: number;
    projectedAccessImprovement: number;
  };
}

function calculatePopulationImpact(type: InterventionType, budget: number, region: RegionData): [number, number] {
  const bench = COST_BENCHMARKS[type];
  let popServed = 0;

  if (type === 'borehole') {
    const b = bench as typeof COST_BENCHMARKS.borehole;
    const avgCost = (b.minCost + b.maxCost) / 2;
    const numBoreholes = Math.floor(budget / avgCost);
    popServed = numBoreholes * ((b.minPop + b.maxPop) / 2);
  } else if (type === 'rainwater_harvesting') {
    const b = bench as typeof COST_BENCHMARKS.rainwater_harvesting;
    const avgCostPerHH = (b.minCostPerHH + b.maxCostPerHH) / 2;
    popServed = Math.floor(budget / avgCostPerHH) * b.hhSize;
  } else if (type === 'surface_water_treatment') {
    const b = bench as typeof COST_BENCHMARKS.surface_water_treatment;
    const avgCost = (b.minCost + b.maxCost) / 2;
    popServed = Math.floor(budget / avgCost) * ((b.minPop + b.maxPop) / 2);
  } else if (type === 'managed_aquifer_recharge') {
    const b = bench as typeof COST_BENCHMARKS.managed_aquifer_recharge;
    const avgCost = (b.minCost + b.maxCost) / 2;
    popServed = Math.floor(budget / avgCost) * ((b.minPop + b.maxPop) / 2);
  } else if (type === 'piped_water_extension') {
    const b = bench as typeof COST_BENCHMARKS.piped_water_extension;
    const avgConnCost = (b.connCostMin + b.connCostMax) / 2;
    popServed = Math.floor((budget * 0.8) / avgConnCost);
  } else if (type === 'desalination') {
    const b = bench as typeof COST_BENCHMARKS.desalination;
    const dailyCapacity = budget / b.capitalPerM3Day;
    popServed = Math.floor(dailyCapacity * 20);
  }

  const costPerPerson = popServed > 0 ? budget / popServed : Infinity;
  return [Math.round(popServed), Math.round(costPerPerson * 100) / 100];
}

export function runSimulation(
  regions: RegionData[],
  totalBudget: number,
  targetRegionIds: string[],
  timeHorizonYears: number = 5,
  priority: 'population' | 'cost_effectiveness' | 'sustainability' = 'population',
  includeMaintenance: boolean = true
): SimulationResult {
  // Build candidates
  const candidates: {
    regionId: string; regionName: string; country: string;
    type: InterventionType; name: string; cost: number;
    popServed: number; costEffectiveness: number;
    suitability: number; riskPriority: number;
  }[] = [];

  const targetRegions = regions.filter(r => targetRegionIds.includes(r.id));

  for (const region of targetRegions) {
    const { riskLevel } = classifyRegion(region);
    const riskPriority = { critical: 4, high: 3, moderate: 2, low: 1 }[riskLevel];
    const recs = getRecommendations(region);

    for (const rec of recs) {
      if (rec.suitabilityScore < 0.1) continue;
      const cost = (rec.estimatedCostMin + rec.estimatedCostMax) / 2;
      const pop = (rec.populationServedMin + rec.populationServedMax) / 2;
      candidates.push({
        regionId: region.id, regionName: region.name, country: region.country,
        type: rec.type, name: rec.name, cost, popServed: Math.round(pop),
        costEffectiveness: pop / cost, suitability: rec.suitabilityScore, riskPriority,
      });
    }
  }

  // Sort by priority
  if (priority === 'population') candidates.sort((a, b) => b.popServed - a.popServed);
  else if (priority === 'cost_effectiveness') candidates.sort((a, b) => b.costEffectiveness - a.costEffectiveness);
  else candidates.sort((a, b) => (b.riskPriority + b.suitability) - (a.riskPriority + a.suitability));

  // Greedy allocation
  let remaining = totalBudget;
  const allocatedRegions = new Set<string>();
  const allocations: AllocationResult[] = [];

  for (const c of candidates) {
    if (remaining < c.cost * 0.5) continue;
    if (allocatedRegions.has(c.regionId)) continue;

    const allocated = Math.min(remaining, c.cost);
    const [popServed, costPerPerson] = calculatePopulationImpact(
      c.type, allocated, targetRegions.find(r => r.id === c.regionId)!
    );

    if (popServed === 0) continue;

    const maintenanceCost = includeMaintenance
      ? allocated * (COST_BENCHMARKS[c.type] as any).maintenancePct * timeHorizonYears
      : 0;

    const effectiveBudget = allocated - maintenanceCost;
    if (effectiveBudget <= 0) continue;

    allocations.push({
      regionId: c.regionId, regionName: c.regionName, country: c.country,
      interventionType: c.type, interventionName: c.name,
      allocatedBudget: Math.round(allocated),
      populationServed: popServed, costPerPerson,
      suitabilityScore: c.suitability,
    });

    remaining -= allocated;
    allocatedRegions.add(c.regionId);
  }

  const totalPop = allocations.reduce((s, a) => s + a.populationServed, 0);
  const totalAllocated = allocations.reduce((s, a) => s + a.allocatedBudget, 0);
  const totalTargetPop = targetRegions.reduce((s, r) => s + r.population, 0);

  return {
    totalBudget, timeHorizonYears, priority,
    allocations,
    summary: {
      totalPopulationServed: totalPop,
      averageCostPerPerson: totalPop > 0 ? Math.round((totalAllocated / totalPop) * 100) / 100 : 0,
      regionsServed: allocations.length,
      sustainabilityScore: Math.round((allocations.reduce((s, a) => s + a.suitabilityScore, 0) / Math.max(1, allocations.length)) * 100) / 100,
      projectedAccessImprovement: totalTargetPop > 0 ? Math.round((totalPop / totalTargetPop) * 100 * 10) / 10 : 0,
    },
  };
}
