const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface RegionIndicators {
  water_access_pct: number;
  sanitation_pct: number;
  water_stress: number;
  flood_risk: number;
  drought_risk: number;
  climate_vulnerability: number;
  infrastructure_gap: number;
  groundwater_potential: number;
  precipitation_mm: number;
  composite_risk: number;
}

export interface FloodEvent {
  id: string;
  date: string;
  severity: number;
  area_km2: number;
  latitude: number;
  longitude: number;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  risk_level: "critical" | "high" | "moderate" | "low";
  indicators: RegionIndicators;
  flood_events: FloodEvent[];
  data_sources: string[];
}

export interface InterventionRecommendation {
  type: string;
  name: string;
  suitability_score: number;
  estimated_cost_usd: number;
  population_served: number;
  reliability_score: number;
  sustainability_score: number;
  rationale: string;
}

export interface SimulationResult {
  total_budget: number;
  allocated_budget: number;
  time_horizon_years: number;
  priority: string;
  total_population_served: number;
  regions_covered: number;
  allocations: {
    region_id: string;
    region_name: string;
    country: string;
    intervention: string;
    allocated_usd: number;
    population_impact: number;
    cost_per_person: number;
    sustainability_score: number;
  }[];
  cost_per_person_avg: number;
  sdg6_progress_pct: number;
}

export interface PolicyRecommendation {
  executive_summary: string;
  priority_actions: string[];
  budget_breakdown: Record<string, number>;
  risk_factors: string[];
  sdg6_alignment: Record<string, string>;
  implementation_timeline: string;
  data_confidence: string;
}

export interface Statistics {
  total_regions: number;
  total_countries: number;
  countries: string[];
  total_population: number;
  population_unserved: number;
  risk_distribution: Record<string, number>;
  avg_water_stress: number;
  avg_water_access_pct: number;
  data_sources: { name: string; status: string; coverage: string }[];
}

export const api = {
  getRegions: (params?: { country?: string; risk_level?: string }) => {
    const query = new URLSearchParams();
    if (params?.country) query.set("country", params.country);
    if (params?.risk_level) query.set("risk_level", params.risk_level);
    const qs = query.toString();
    return fetchApi<Region[]>(`/api/regions${qs ? `?${qs}` : ""}`);
  },

  getRegion: (id: string) => fetchApi<Region>(`/api/regions/${id}`),

  getInsights: (id: string) =>
    fetchApi<{ region_id: string; insights: string[] }>(
      `/api/regions/${id}/insights`
    ),

  getInterventions: (id: string) =>
    fetchApi<{ region_id: string; interventions: InterventionRecommendation[] }>(
      `/api/regions/${id}/interventions`
    ),

  simulate: (params: {
    budget_usd: number;
    time_horizon_years?: number;
    target_regions?: string[];
    priority?: string;
  }) =>
    fetchApi<SimulationResult>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  getPolicy: (regionId: string, budgetUsd?: number) => {
    const query = budgetUsd ? `?budget_usd=${budgetUsd}` : "";
    return fetchApi<PolicyRecommendation>(`/api/recommend/${regionId}${query}`, {
      method: "POST",
    });
  },

  getStatistics: () => fetchApi<Statistics>("/api/statistics"),

  getComparativeAnalysis: (country?: string) => {
    const query = country ? `?country=${country}` : "";
    return fetchApi<{ analysis: string }>(`/api/analysis/comparative${query}`);
  },

  askAgent: (question: string, contextRegionId?: string) =>
    fetchApi<{ answer: string; data_used: string[]; confidence: string }>(
      "/api/agent/ask",
      {
        method: "POST",
        body: JSON.stringify({
          question,
          context_region_id: contextRegionId,
        }),
      }
    ),
};
