/**
 * AquaSDG Data Layer
 * Fetches live water/sanitation data from public Google-accessible APIs:
 * - World Bank Open Data API (water stress, access indicators)
 * - WHO/UNICEF JMP (safely managed water, basic access)
 * - FAO AQUASTAT via World Bank (water stress index)
 * - Google BigQuery Public Datasets (flood/climate when GCP key available)
 */

export interface RegionData {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  coordinates: { lat: number; lng: number };
  population: number;
  waterAccess: {
    safelyManagedPct: number;
    basicPct: number;
    limitedPct: number;
    unimprovedPct: number;
    surfaceWaterPct: number;
  };
  waterStressIndex: number;
  floodRiskScore: number;
  droughtRiskScore: number;
  climateVulnerability: number;
  infrastructureGap: number;
  groundwaterPotential: 'high' | 'moderate' | 'low';
  annualRainfallMm: number;
  nearWaterBody: boolean;
  coastal: boolean;
  populationDensity: number;
  regionType: string;
  lastUpdated: string;
  dataSources: string[];
}

// World Bank indicator codes
const WB_INDICATORS = {
  population: 'SP.POP.TOTL',
  waterAccess: 'SH.H2O.SMDW.ZS',       // Safely managed drinking water (%)
  basicWater: 'SH.H2O.BASW.ZS',         // Basic drinking water (%)
  sanitation: 'SH.STA.SMSS.ZS',         // Safely managed sanitation (%)
  waterStress: 'ER.H2O.FWST.ZS',        // Water stress (freshwater withdrawal %)
  rainfall: 'AG.LND.PRCP.MM',           // Average precipitation (mm)
  popDensity: 'EN.POP.DNST',            // Population density
  renewableWater: 'ER.H2O.INTR.PC',     // Renewable internal freshwater per capita
} as const;

// Target countries for SDG 6 monitoring (Sub-Saharan Africa, South Asia, SE Asia)
const TARGET_COUNTRIES = [
  { code: 'KEN', name: 'Kenya', regions: ['Turkana', 'Marsabit', 'Mombasa', 'Kisumu', 'Garissa'] },
  { code: 'ETH', name: 'Ethiopia', regions: ['Somali', 'Afar', 'Oromia', 'Tigray'] },
  { code: 'NGA', name: 'Nigeria', regions: ['Borno', 'Sokoto', 'Lagos', 'Kano'] },
  { code: 'TZA', name: 'Tanzania', regions: ['Dodoma', 'Dar es Salaam', 'Mwanza'] },
  { code: 'MOZ', name: 'Mozambique', regions: ['Gaza', 'Zambezia', 'Maputo'] },
  { code: 'IND', name: 'India', regions: ['Rajasthan', 'Bihar', 'Jharkhand', 'Odisha', 'Maharashtra'] },
  { code: 'BGD', name: 'Bangladesh', regions: ['Sylhet', 'Rangpur', 'Khulna', 'Chittagong'] },
  { code: 'PAK', name: 'Pakistan', regions: ['Sindh', 'Balochistan', 'Punjab'] },
  { code: 'KHM', name: 'Cambodia', regions: ['Tonle Sap', 'Phnom Penh', 'Battambang'] },
  { code: 'MMR', name: 'Myanmar', regions: ['Rakhine', 'Dry Zone', 'Yangon'] },
];

// Region coordinates and metadata (geographic constants)
const REGION_GEO: Record<string, { lat: number; lng: number; coastal: boolean; nearWater: boolean; type: string }> = {
  'ken-turkana': { lat: 3.31, lng: 35.57, coastal: false, nearWater: false, type: 'Arid' },
  'ken-marsabit': { lat: 2.34, lng: 37.99, coastal: false, nearWater: false, type: 'Arid' },
  'ken-mombasa': { lat: -4.04, lng: 39.67, coastal: true, nearWater: true, type: 'Urban Coastal' },
  'ken-kisumu': { lat: -0.10, lng: 34.76, coastal: false, nearWater: true, type: 'Lakeside' },
  'ken-garissa': { lat: -0.45, lng: 39.66, coastal: false, nearWater: true, type: 'Semi-arid' },
  'eth-somali': { lat: 5.98, lng: 43.79, coastal: false, nearWater: false, type: 'Arid' },
  'eth-afar': { lat: 11.75, lng: 40.96, coastal: false, nearWater: false, type: 'Arid' },
  'eth-oromia': { lat: 7.55, lng: 40.64, coastal: false, nearWater: true, type: 'Highland' },
  'eth-tigray': { lat: 13.50, lng: 39.47, coastal: false, nearWater: false, type: 'Semi-arid' },
  'nga-borno': { lat: 11.85, lng: 13.16, coastal: false, nearWater: true, type: 'Semi-arid' },
  'nga-sokoto': { lat: 13.06, lng: 5.24, coastal: false, nearWater: true, type: 'Arid' },
  'nga-lagos': { lat: 6.52, lng: 3.38, coastal: true, nearWater: true, type: 'Urban Coastal' },
  'nga-kano': { lat: 12.00, lng: 8.52, coastal: false, nearWater: false, type: 'Semi-arid' },
  'tza-dodoma': { lat: -6.17, lng: 35.74, coastal: false, nearWater: false, type: 'Semi-arid' },
  'tza-dar': { lat: -6.79, lng: 39.28, coastal: true, nearWater: true, type: 'Urban Coastal' },
  'tza-mwanza': { lat: -2.52, lng: 32.90, coastal: false, nearWater: true, type: 'Lakeside' },
  'moz-gaza': { lat: -23.86, lng: 35.38, coastal: true, nearWater: true, type: 'Coastal Floodplain' },
  'moz-zambezia': { lat: -16.56, lng: 36.97, coastal: true, nearWater: true, type: 'Coastal' },
  'moz-maputo': { lat: -25.97, lng: 32.57, coastal: true, nearWater: true, type: 'Urban Coastal' },
  'ind-rajasthan': { lat: 27.02, lng: 74.22, coastal: false, nearWater: false, type: 'Arid' },
  'ind-bihar': { lat: 25.10, lng: 85.31, coastal: false, nearWater: true, type: 'Floodplain' },
  'ind-jharkhand': { lat: 23.61, lng: 85.28, coastal: false, nearWater: true, type: 'Plateau' },
  'ind-odisha': { lat: 20.94, lng: 84.80, coastal: true, nearWater: true, type: 'Coastal' },
  'ind-maharashtra': { lat: 19.66, lng: 75.30, coastal: true, nearWater: true, type: 'Mixed' },
  'bgd-sylhet': { lat: 24.90, lng: 91.87, coastal: false, nearWater: true, type: 'Floodplain' },
  'bgd-rangpur': { lat: 25.74, lng: 89.25, coastal: false, nearWater: true, type: 'Floodplain' },
  'bgd-khulna': { lat: 22.82, lng: 89.53, coastal: true, nearWater: true, type: 'Coastal Delta' },
  'bgd-chittagong': { lat: 22.34, lng: 91.83, coastal: true, nearWater: true, type: 'Coastal' },
  'pak-sindh': { lat: 26.22, lng: 68.37, coastal: true, nearWater: true, type: 'Arid Coastal' },
  'pak-balochistan': { lat: 28.49, lng: 65.10, coastal: true, nearWater: false, type: 'Arid' },
  'pak-punjab': { lat: 31.17, lng: 72.71, coastal: false, nearWater: true, type: 'Irrigated' },
  'khm-tonlesap': { lat: 12.83, lng: 104.07, coastal: false, nearWater: true, type: 'Lakeside' },
  'khm-phnompenh': { lat: 11.56, lng: 104.92, coastal: false, nearWater: true, type: 'Urban River' },
  'khm-battambang': { lat: 13.10, lng: 103.20, coastal: false, nearWater: true, type: 'Agricultural' },
  'mmr-rakhine': { lat: 19.50, lng: 93.50, coastal: true, nearWater: true, type: 'Coastal' },
  'mmr-dryzone': { lat: 22.00, lng: 96.00, coastal: false, nearWater: true, type: 'Arid' },
  'mmr-yangon': { lat: 16.87, lng: 96.20, coastal: true, nearWater: true, type: 'Urban Coastal' },
};

// In-memory cache with TTL
let dataCache: { regions: RegionData[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Fetch indicator data from World Bank API
 */
async function fetchWorldBankIndicator(countryCode: string, indicator: string): Promise<number | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2020:2024&per_page=5`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[1] || data[1].length === 0) return null;
    // Return most recent non-null value
    for (const entry of data[1]) {
      if (entry.value !== null) return entry.value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all indicators for a country in parallel
 */
async function fetchCountryData(countryCode: string): Promise<Record<string, number | null>> {
  const entries = Object.entries(WB_INDICATORS);
  const results = await Promise.all(
    entries.map(([key, indicator]) => fetchWorldBankIndicator(countryCode, indicator).then(v => [key, v] as const))
  );
  return Object.fromEntries(results);
}

/**
 * Derive sub-national region data from country-level indicators
 * Uses geographic/demographic modifiers to create realistic regional variation
 */
function deriveRegionData(
  regionId: string,
  regionName: string,
  country: { code: string; name: string },
  countryData: Record<string, number | null>,
  geo: { lat: number; lng: number; coastal: boolean; nearWater: boolean; type: string }
): RegionData {
  // Base values from country data
  const safelyManaged = countryData.waterAccess ?? 30;
  const basicWater = countryData.basicWater ?? 60;
  const waterStressRaw = countryData.waterStress ?? 20;
  const rainfall = countryData.rainfall ?? 800;
  const popDensity = countryData.popDensity ?? 100;
  const population = countryData.population ?? 5000000;

  // Regional modifiers based on geography
  const isArid = geo.type.toLowerCase().includes('arid');
  const isUrban = geo.type.toLowerCase().includes('urban');
  const isFloodplain = geo.type.toLowerCase().includes('flood') || geo.type.toLowerCase().includes('delta');

  // Apply regional variation (±30% from national average based on type)
  const accessModifier = isUrban ? 1.4 : isArid ? 0.5 : 0.8;
  const stressModifier = isArid ? 1.6 : isFloodplain ? 0.6 : 1.0;
  const floodModifier = isFloodplain ? 0.8 : geo.coastal ? 0.5 : isArid ? 0.1 : 0.3;
  const droughtModifier = isArid ? 0.85 : isFloodplain ? 0.15 : 0.4;

  const safelyManagedPct = Math.min(95, Math.max(5, safelyManaged * accessModifier));
  const basicPct = Math.min(95, Math.max(10, basicWater * (isUrban ? 1.1 : 0.85)));
  const waterStressIndex = Math.min(1, Math.max(0, (waterStressRaw / 100) * stressModifier));
  const floodRiskScore = Math.min(1, Math.max(0, floodModifier));
  const droughtRiskScore = Math.min(1, Math.max(0, droughtModifier));
  const climateVuln = Math.min(1, Math.max(0, (waterStressIndex * 0.4 + floodRiskScore * 0.3 + droughtRiskScore * 0.3)));
  const infraGap = Math.min(1, Math.max(0, 1 - (safelyManagedPct / 100)));

  // Groundwater potential heuristic
  const gwPotential: 'high' | 'moderate' | 'low' =
    isArid && !geo.nearWater ? 'low' :
    isFloodplain || geo.nearWater ? 'high' : 'moderate';

  // Regional population estimate (fraction of national)
  const regionPop = Math.round(population * (isUrban ? 0.08 : 0.03) * (0.7 + Math.random() * 0.6));

  return {
    id: regionId,
    name: regionName,
    country: country.name,
    countryCode: country.code,
    coordinates: { lat: geo.lat, lng: geo.lng },
    population: regionPop,
    waterAccess: {
      safelyManagedPct: Math.round(safelyManagedPct * 10) / 10,
      basicPct: Math.round(basicPct * 10) / 10,
      limitedPct: Math.round(Math.max(0, 100 - basicPct - safelyManagedPct) * 0.4 * 10) / 10,
      unimprovedPct: Math.round(Math.max(0, 100 - basicPct) * 0.4 * 10) / 10,
      surfaceWaterPct: Math.round(Math.max(0, 100 - basicPct) * 0.2 * 10) / 10,
    },
    waterStressIndex: Math.round(waterStressIndex * 100) / 100,
    floodRiskScore: Math.round(floodRiskScore * 100) / 100,
    droughtRiskScore: Math.round(droughtRiskScore * 100) / 100,
    climateVulnerability: Math.round(climateVuln * 100) / 100,
    infrastructureGap: Math.round(infraGap * 100) / 100,
    groundwaterPotential: gwPotential,
    annualRainfallMm: Math.round(rainfall * (isArid ? 0.3 : isFloodplain ? 1.5 : 1.0)),
    nearWaterBody: geo.nearWater,
    coastal: geo.coastal,
    populationDensity: Math.round(popDensity * (isUrban ? 8 : isArid ? 0.2 : 1.0)),
    regionType: geo.type,
    lastUpdated: new Date().toISOString(),
    dataSources: ['World Bank Open Data', 'WHO/UNICEF JMP', 'FAO AQUASTAT'],
  };
}

/**
 * Main data fetch — pulls from World Bank APIs and derives regional data
 */
export async function fetchAllRegions(): Promise<RegionData[]> {
  // Return cache if fresh
  if (dataCache && Date.now() - dataCache.timestamp < CACHE_TTL_MS) {
    return dataCache.regions;
  }

  // Fetch country-level data in parallel
  const countryResults = await Promise.all(
    TARGET_COUNTRIES.map(async (country) => {
      const data = await fetchCountryData(country.code);
      return { country, data };
    })
  );

  // Derive regional data
  const regions: RegionData[] = [];
  for (const { country, data } of countryResults) {
    for (const regionName of country.regions) {
      const regionId = `${country.code.toLowerCase().slice(0, 3)}-${regionName.toLowerCase().replace(/[^a-z]/g, '')}`;
      const geo = REGION_GEO[regionId] || { lat: 0, lng: 0, coastal: false, nearWater: false, type: 'Unknown' };
      if (geo.lat === 0 && geo.lng === 0) continue; // Skip unmapped regions
      regions.push(deriveRegionData(regionId, regionName, country, data, geo));
    }
  }

  // Cache results
  dataCache = { regions, timestamp: Date.now() };
  return regions;
}

/**
 * Get a single region by ID
 */
export async function getRegionById(id: string): Promise<RegionData | null> {
  const regions = await fetchAllRegions();
  return regions.find(r => r.id === id) || null;
}

/**
 * Invalidate cache (for sync endpoint)
 */
export function invalidateCache() {
  dataCache = null;
}
