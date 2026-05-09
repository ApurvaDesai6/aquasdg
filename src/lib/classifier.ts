/**
 * Risk Classification Engine (ported from Python classifier.py)
 * Weighted scoring model for water access risk assessment
 */

import { RegionData } from './data';

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

const WEIGHTS = {
  waterStressIndex: 0.40,
  floodRisk: 0.20,
  climateVulnerability: 0.20,
  infrastructureGap: 0.20,
};

export function calculateCompositeRisk(region: RegionData): number {
  return (
    region.waterStressIndex * WEIGHTS.waterStressIndex +
    region.floodRiskScore * WEIGHTS.floodRisk +
    region.climateVulnerability * WEIGHTS.climateVulnerability +
    region.infrastructureGap * WEIGHTS.infrastructureGap
  );
}

function classifyByAccess(safelyManagedPct: number): RiskLevel {
  if (safelyManagedPct < 25) return 'critical';
  if (safelyManagedPct < 50) return 'high';
  if (safelyManagedPct < 75) return 'moderate';
  return 'low';
}

function classifyByComposite(score: number): RiskLevel {
  if (score >= 0.75) return 'critical';
  if (score >= 0.50) return 'high';
  if (score >= 0.25) return 'moderate';
  return 'low';
}

const SEVERITY: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

export function classifyRegion(region: RegionData) {
  const compositeScore = calculateCompositeRisk(region);
  const accessLevel = classifyByAccess(region.waterAccess.safelyManagedPct);
  const compositeLevel = classifyByComposite(compositeScore);
  const riskLevel = SEVERITY[accessLevel] >= SEVERITY[compositeLevel] ? accessLevel : compositeLevel;

  const riskFactors = {
    waterAccessRisk: 1 - (region.waterAccess.safelyManagedPct / 100),
    waterStressRisk: region.waterStressIndex,
    floodRisk: region.floodRiskScore,
    droughtRisk: region.droughtRiskScore,
    climateVulnerability: region.climateVulnerability,
    infrastructureGap: region.infrastructureGap,
  };

  return { riskLevel, compositeScore: Math.round(compositeScore * 10000) / 10000, riskFactors };
}

export function getRecommendation(riskLevel: RiskLevel, region: RegionData): string {
  const recs: Record<RiskLevel, string> = {
    critical: `URGENT: ${region.name}, ${region.country} requires immediate intervention. Water access is critically low. Priority: emergency supply, groundwater assessment, infrastructure support.`,
    high: `HIGH PRIORITY: ${region.name}, ${region.country} faces significant water access challenges. Recommended: detailed resource assessment, community water management, infrastructure planning.`,
    moderate: `ATTENTION NEEDED: ${region.name}, ${region.country} has moderate water access issues. Focus on quality improvement, infrastructure extension, climate resilience.`,
    low: `MONITORING: ${region.name}, ${region.country} has relatively good water access. Maintain infrastructure, focus on sustainability and climate adaptation.`,
  };
  return recs[riskLevel];
}

export function getDeepInsights(region: RegionData) {
  const insights: any[] = [];

  if (region.waterStressIndex > 0.7 && region.waterAccess.safelyManagedPct < 40) {
    insights.push({
      type: 'infrastructure', label: 'Critical Supply-Demand Gap',
      value: `${Math.round(region.waterStressIndex * 100)}% Stress`,
      description: 'High baseline water stress combined with severely limited safely managed access. Requires urgent decentralized supply solutions.',
      impact_level: 'critical', icon: 'AlertTriangle',
    });
  } else if (region.waterStressIndex > 0.5) {
    insights.push({
      type: 'infrastructure', label: 'Emerging Water Stress', value: 'Moderate',
      description: 'Baseline water stress is increasing. Recommend demand management and loss reduction programs.',
      impact_level: 'high', icon: 'Droplets',
    });
  }

  if (region.floodRiskScore > 0.6 && region.populationDensity > 500) {
    insights.push({
      type: 'climate', label: 'High-Density Inundation Risk',
      value: `Risk: ${Math.round(region.floodRiskScore * 100)}%`,
      description: 'Densely populated area in a high-risk flood zone. Focus on urban drainage and early warning systems.',
      impact_level: 'high', icon: 'Waves',
    });
  }

  if (region.waterAccess.safelyManagedPct < 30 && region.groundwaterPotential !== 'low') {
    insights.push({
      type: 'opportunity', label: 'Untapped Subsurface Potential',
      value: region.groundwaterPotential.charAt(0).toUpperCase() + region.groundwaterPotential.slice(1),
      description: `Region has ${region.groundwaterPotential} groundwater potential but low safely managed access. Targeted borehole drilling is a high-ROI intervention.`,
      impact_level: 'moderate', icon: 'Zap',
    });
  }

  const compositeRisk = calculateCompositeRisk(region);
  const resilienceScore = Math.round(((1 - compositeRisk) * 0.6 + (region.waterAccess.safelyManagedPct / 100) * 0.4) * 100 * 100) / 100;

  const correlations: any[] = [];
  const access = region.waterAccess.safelyManagedPct / 100;
  if (Math.abs(access - (1 - region.infrastructureGap)) > 0.3) {
    correlations.push({
      factor_a: 'Water Access', factor_b: 'Infra Gap', relationship: 'Inverse Anomaly', strength: 0.85,
      description: 'Access is unexpectedly high relative to infrastructure levels, suggesting strong informal or community-led water systems.',
    });
  }
  if (region.populationDensity > 1000 && region.floodRiskScore > 0.5) {
    correlations.push({
      factor_a: 'Density', factor_b: 'Flood Risk', relationship: 'High Exposure', strength: 0.92,
      description: 'Extreme vulnerability where flood risk intersects with high-density settlements.',
    });
  }

  return { resilienceScore, insights, correlations, confidenceScore: 0.94 };
}
