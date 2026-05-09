// AquaSDG Unified Type System

export type IndicatorType = 
  | 'overall'
  | 'composite_risk' 
  | 'water_access' 
  | 'sanitation' 
  | 'water_stress' 
  | 'flood_risk' 
  | 'drought_risk' 
  | 'climate_vulnerability' 
  | 'infrastructure_gap' 
  | 'policy_vector';

// Support both naming schemes for backward compatibility
export type RiskLevel = 
  | 'normal' | 'watch' | 'warning' | 'danger' 
  | 'low' | 'moderate' | 'high' | 'critical' 
  | 'all';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FloodEvent {
  id: string;
  eventDate: string;
  severity: number;
  affectedAreaKm2: number;
  dataSource: string;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  iso3?: string;
  adminLevel?: string;
  coordinates: Coordinates;
  population: number;
  riskLevel: RiskLevel;
  indicators: {
    composite_risk: number;
    water_access: number;
    sanitation: number;
    water_stress: number;
    flood_risk: number;
    drought_risk: number;
    climate_vulnerability: number;
    infrastructure_gap: number;
    policy_vector: number;
  };
  sources: string[];
  lastUpdated: string;
  floodEvents?: FloodEvent[];
}

export interface Statistics {
  total_regions: number;
  countries: number;
  total_population: number;
  averages: {
    water_access: number;
    sanitation: number;
    water_stress: number;
    flood_risk: number;
  };
  risk_distribution: Record<string, number>;
  data_sources: Array<{ name: string; url: string; description: string }>;
}

export interface ApiKeys {
  googleCloud: string;
  gemini: string;
}

export interface RegionSummary {
  id: string;
  name: string;
  country: string;
  region_type: string;
  coordinates: Coordinates;
  population: number;
  risk_level: RiskLevel;
  composite_risk_score: number;
  water_access_pct: number;
}

export interface InterventionRecommendation {
  intervention_type: string;
  name: string;
  description: string;
  suitability_score: number;
  estimated_cost: number;
  population_served: number;
  cost_per_person: number;
  implementation_time_months: number;
  sustainability_score: number;
  prerequisites: string[];
}
