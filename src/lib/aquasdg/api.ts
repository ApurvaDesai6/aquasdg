// AquaSDG API Utilities
// All API calls go through the ML service on port 3001



async function fetchFromMLService<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  
  const baseUrl = '';
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Regions
export async function getRegions(params?: {
  country?: string;
  risk_level?: string;
  min_population?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.country) searchParams.set('country', params.country);
  if (params?.risk_level) searchParams.set('risk_level', params.risk_level);
  if (params?.min_population) searchParams.set('min_population', String(params.min_population));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  
  const queryString = searchParams.toString();
  const endpoint = `/api/regions${queryString ? `&${queryString}` : ''}`;
  
  return fetchFromMLService<typeof endpoint extends string ? any : never>(endpoint);
}

export async function getRegionDetails(regionId: string) {
  return fetchFromMLService<any>(`/api/regions/${regionId}`);
}

// Risk Prediction
export async function predictRisk(data: {
  region_id: string;
  water_stress_index?: number;
  flood_risk_score?: number;
  climate_vulnerability?: number;
  infrastructure_gap?: number;
  safely_managed_pct?: number;
}) {
  return fetchFromMLService<any>('/api/predict-risk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Interventions
export async function getInterventionRecommendations(data: {
  region_id: string;
  budget_limit?: number;
  priority_interventions?: string[];
}) {
  return fetchFromMLService<any>('/api/recommend-interventions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Simulation
export async function runSimulation(data: {
  total_budget: number;
  time_horizon_years: number;
  target_regions: string[];
  priority?: 'population' | 'cost_effectiveness' | 'sustainability';
  include_maintenance?: boolean;
}) {
  return fetchFromMLService<any>('/api/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Reference Data
export async function getCountries() {
  return fetchFromMLService<string[]>('/api/countries');
}

export async function getInterventionTypes() {
  return fetchFromMLService<any[]>('/api/intervention-types');
}

export async function getStatistics() {
  return fetchFromMLService<any>('/api/statistics');
}

// Health Check
export async function checkHealth() {
  return fetchFromMLService<{
    status: string;
    service: string;
    version: string;
    regions_loaded: number;
    uptime_seconds: number;
  }>('/health');
}
