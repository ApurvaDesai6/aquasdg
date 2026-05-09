/**
 * Intervention Recommendation Engine (ported from Python interventions.py)
 */

import { RegionData } from './data';

export const COST_BENCHMARKS = {
  borehole: { minCost: 15000, maxCost: 50000, minPop: 500, maxPop: 2000, maintenancePct: 0.05, lifespan: 20 },
  rainwater_harvesting: { minCostPerHH: 50, maxCostPerHH: 200, hhSize: 5, maintenancePct: 0.03, lifespan: 15 },
  surface_water_treatment: { minCost: 100000, maxCost: 500000, minPop: 5000, maxPop: 50000, maintenancePct: 0.08, lifespan: 25 },
  managed_aquifer_recharge: { minCost: 50000, maxCost: 200000, minPop: 2000, maxPop: 20000, maintenancePct: 0.04, lifespan: 30 },
  piped_water_extension: { costPerMeterMin: 50, costPerMeterMax: 150, connCostMin: 50, connCostMax: 200, maintenancePct: 0.06, lifespan: 40 },
  desalination: { capitalPerM3Day: 1000, minPop: 10000, maintenancePct: 0.10, lifespan: 20 },
} as const;

export const INTERVENTION_TYPES = {
  borehole: { name: 'Borehole/Groundwater Wells', description: 'Deep wells accessing groundwater aquifers', reliabilityScore: 0.85 },
  rainwater_harvesting: { name: 'Rainwater Harvesting Systems', description: 'Collection and storage of rainwater for domestic use', reliabilityScore: 0.65 },
  surface_water_treatment: { name: 'Surface Water Treatment', description: 'Treatment of water from rivers, lakes, or reservoirs', reliabilityScore: 0.90 },
  managed_aquifer_recharge: { name: 'Managed Aquifer Recharge (MAR)', description: 'Storing flood water underground for later use', reliabilityScore: 0.75 },
  piped_water_extension: { name: 'Piped Water Extension', description: 'Extending existing piped water networks', reliabilityScore: 0.95 },
  desalination: { name: 'Desalination Plant', description: 'Converting seawater to freshwater', reliabilityScore: 0.92 },
} as const;

export type InterventionType = keyof typeof INTERVENTION_TYPES;

export interface Recommendation {
  type: InterventionType;
  name: string;
  description: string;
  suitabilityScore: number;
  justification: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  populationServedMin: number;
  populationServedMax: number;
  reliabilityScore: number;
}

function scoreBorehole(r: RegionData): [number, string] {
  let score = 0; const j: string[] = [];
  if (r.groundwaterPotential === 'high') { score += 0.35; j.push('Excellent groundwater potential'); }
  else if (r.groundwaterPotential === 'moderate') { score += 0.20; j.push('Moderate groundwater potential'); }
  else { score -= 0.20; j.push('Limited groundwater potential'); }
  if (r.floodRiskScore < 0.3) { score += 0.25; j.push('Low flood risk'); }
  else if (r.floodRiskScore > 0.6) { score -= 0.15; j.push('High flood risk may contaminate wells'); }
  if (r.droughtRiskScore > 0.5) { score += 0.15; j.push('Boreholes provide drought resilience'); }
  if (r.populationDensity < 100) { score += 0.15; j.push('Well-suited for rural population'); }
  if (r.waterStressIndex > 0.6) { score += 0.10; j.push('Addresses high water stress'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

function scoreRainwater(r: RegionData): [number, string] {
  let score = 0; const j: string[] = [];
  if (r.annualRainfallMm >= 800) { score += 0.30; j.push(`Good rainfall (${r.annualRainfallMm}mm)`); }
  else if (r.annualRainfallMm >= 400) { score += 0.15; j.push(`Moderate rainfall (${r.annualRainfallMm}mm)`); }
  else { score -= 0.25; j.push(`Low rainfall (${r.annualRainfallMm}mm)`); }
  if (r.populationDensity < 100) { score += 0.25; j.push('Ideal for dispersed communities'); }
  if (r.waterStressIndex > 0.4) { score += 0.15; j.push('Supplementary during stress'); }
  if (r.floodRiskScore > 0.5) { score += 0.10; j.push('Manages excess water'); }
  if (r.climateVulnerability > 0.6) { score += 0.10; j.push('Builds climate resilience'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

function scoreSurfaceWater(r: RegionData): [number, string] {
  let score = 0; const j: string[] = [];
  if (r.nearWaterBody) { score += 0.35; j.push('Near water body'); } else { score -= 0.30; j.push('No nearby surface water'); }
  if (r.waterStressIndex < 0.5) { score += 0.20; j.push('Sustainable abstraction possible'); }
  if (r.populationDensity > 100) { score += 0.20; j.push('Density justifies treatment plant'); }
  if (r.floodRiskScore < 0.4) { score += 0.10; j.push('Low flood risk for stability'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

function scoreMAR(r: RegionData): [number, string] {
  let score = 0; const j: string[] = [];
  if (r.floodRiskScore > 0.6) { score += 0.35; j.push('High flood risk — MAR captures excess'); }
  else if (r.floodRiskScore > 0.3) { score += 0.15; j.push('Moderate flood mitigation'); }
  if (r.groundwaterPotential === 'high') { score += 0.30; j.push('Good aquifer storage'); }
  else if (r.groundwaterPotential === 'moderate') { score += 0.15; j.push('Moderate storage'); }
  if (r.annualRainfallMm > 1000) { score += 0.15; j.push('High rainfall for recharge'); }
  if (r.droughtRiskScore > 0.5) { score += 0.15; j.push('Drought buffer'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

function scorePiped(r: RegionData): [number, string] {
  let score = 0; const j: string[] = [];
  if (r.infrastructureGap < 0.4) { score += 0.30; j.push('Existing infrastructure nearby'); }
  else if (r.infrastructureGap > 0.7) { score -= 0.20; j.push('Major investment required'); }
  if (r.populationDensity > 300) { score += 0.30; j.push('High density — cost-effective'); }
  else if (r.populationDensity < 50) { score -= 0.25; j.push('Low density — high per-capita cost'); }
  if (r.waterAccess.safelyManagedPct > 30) { score += 0.15; j.push('Existing managed points to extend'); }
  if (r.regionType.toLowerCase().includes('urban')) { score += 0.15; j.push('Urban area'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

function scoreDesalination(r: RegionData): [number, string] {
  if (!r.coastal) return [0, 'Not applicable — not coastal'];
  let score = 0.25; const j: string[] = ['Coastal location'];
  if (r.waterStressIndex > 0.6) { score += 0.25; j.push('High water stress'); }
  if (r.population > 500000) { score += 0.20; j.push('Economies of scale'); }
  if (r.groundwaterPotential === 'low') { score += 0.15; j.push('Limited groundwater'); }
  if (r.regionType.toLowerCase().includes('urban')) { score += 0.10; j.push('Urban demand'); }
  return [Math.max(0, Math.min(1, score)), j.join('; ')];
}

export function getRecommendations(region: RegionData, budgetLimit?: number): Recommendation[] {
  const scorers: [InterventionType, (r: RegionData) => [number, string]][] = [
    ['borehole', scoreBorehole],
    ['rainwater_harvesting', scoreRainwater],
    ['surface_water_treatment', scoreSurfaceWater],
    ['managed_aquifer_recharge', scoreMAR],
    ['piped_water_extension', scorePiped],
    ['desalination', scoreDesalination],
  ];

  const results: Recommendation[] = [];
  for (const [type, scorer] of scorers) {
    const [score, justification] = scorer(region);
    if (score < 0.1) continue;

    const info = INTERVENTION_TYPES[type];
    const bench = COST_BENCHMARKS[type];
    let costMin: number, costMax: number, popMin: number, popMax: number;

    if (type === 'borehole') { const b = bench as typeof COST_BENCHMARKS.borehole; costMin = b.minCost; costMax = b.maxCost; popMin = b.minPop; popMax = b.maxPop; }
    else if (type === 'rainwater_harvesting') { const b = bench as typeof COST_BENCHMARKS.rainwater_harvesting; const hh = region.population / b.hhSize; costMin = b.minCostPerHH * hh * 0.1; costMax = b.maxCostPerHH * hh * 0.3; popMin = Math.round(hh * b.hhSize * 0.1); popMax = Math.round(hh * b.hhSize * 0.3); }
    else if (type === 'surface_water_treatment') { const b = bench as typeof COST_BENCHMARKS.surface_water_treatment; costMin = b.minCost; costMax = b.maxCost; popMin = b.minPop; popMax = b.maxPop; }
    else if (type === 'managed_aquifer_recharge') { const b = bench as typeof COST_BENCHMARKS.managed_aquifer_recharge; costMin = b.minCost; costMax = b.maxCost; popMin = b.minPop; popMax = b.maxPop; }
    else if (type === 'piped_water_extension') { const b = bench as typeof COST_BENCHMARKS.piped_water_extension; costMin = b.connCostMin * region.population * 0.3; costMax = b.connCostMax * region.population * 0.7; popMin = Math.round(region.population * 0.3); popMax = Math.round(region.population * 0.7); }
    else { const b = bench as typeof COST_BENCHMARKS.desalination; const cap = region.population * 0.05; costMin = b.capitalPerM3Day * cap * 0.5; costMax = b.capitalPerM3Day * cap * 1.5; popMin = b.minPop; popMax = Math.round(cap * 20); }

    if (budgetLimit && costMin > budgetLimit) continue;

    results.push({ type, name: info.name, description: info.description, suitabilityScore: Math.round(score * 100) / 100, justification, estimatedCostMin: Math.round(costMin), estimatedCostMax: Math.round(costMax), populationServedMin: popMin, populationServedMax: popMax, reliabilityScore: info.reliabilityScore });
  }

  return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
