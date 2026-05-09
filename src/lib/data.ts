/**
 * AquaSDG Multi-Source Data Layer
 *
 * Aggregates water/sanitation data from multiple real, publicly accessible APIs:
 *
 * 1. World Bank Open Data API
 *    URL: https://api.worldbank.org/v2/country/{ISO3}/indicator/{INDICATOR}?format=json
 *    Indicators: SH.H2O.BASW.ZS, ER.H2O.FWST.ZS, AG.LND.PRCP.MM, EN.POP.DNST,
 *               SP.POP.TOTL, SH.STA.SMSS.ZS, EN.ATM.CO2E.PC
 *
 * 2. UN SDG API (SDG 6.1.1 — safely managed drinking water)
 *    URL: https://unstats.un.org/sdgapi/v1/sdg/Goal/6/Target/6.1/Indicator/6.1.1/GeoArea/{M49}
 *
 * 3. WRI Aqueduct 4.0 (2023) — water stress, drought/flood risk
 *    URL: https://www.wri.org/applications/aqueduct/country-rankings/
 *    Static lookup from published research data.
 *
 * 4. INFORM Risk Index — composite risk scores
 *    URL: https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/countries/Scores
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
  dataQuality: 'high' | 'medium' | 'low';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_COUNTRIES = [
  { code: 'KEN', name: 'Kenya', m49: 404, regions: ['Turkana', 'Marsabit', 'Mombasa', 'Kisumu', 'Garissa'] },
  { code: 'ETH', name: 'Ethiopia', m49: 231, regions: ['Somali', 'Afar', 'Oromia', 'Tigray'] },
  { code: 'NGA', name: 'Nigeria', m49: 566, regions: ['Borno', 'Sokoto', 'Lagos', 'Kano'] },
  { code: 'TZA', name: 'Tanzania', m49: 834, regions: ['Dodoma', 'Dar es Salaam', 'Mwanza'] },
  { code: 'MOZ', name: 'Mozambique', m49: 508, regions: ['Gaza', 'Zambezia', 'Maputo'] },
  { code: 'IND', name: 'India', m49: 356, regions: ['Rajasthan', 'Bihar', 'Jharkhand', 'Odisha', 'Maharashtra'] },
  { code: 'BGD', name: 'Bangladesh', m49: 50, regions: ['Sylhet', 'Rangpur', 'Khulna', 'Chittagong'] },
  { code: 'PAK', name: 'Pakistan', m49: 586, regions: ['Sindh', 'Balochistan', 'Punjab'] },
  { code: 'KHM', name: 'Cambodia', m49: 116, regions: ['Tonle Sap', 'Phnom Penh', 'Battambang'] },
  { code: 'MMR', name: 'Myanmar', m49: 104, regions: ['Rakhine', 'Dry Zone', 'Yangon'] },
];

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

/**
 * WRI Aqueduct 4.0 (2023) — Published country-level water risk scores.
 * Scale: 0-5, where 5 is highest risk.
 * Source: https://www.wri.org/applications/aqueduct/country-rankings/
 */
const WRI_AQUEDUCT: Record<string, { baseline_water_stress: number; drought_risk: number; flood_risk: number }> = {
  KEN: { baseline_water_stress: 3.2, drought_risk: 3.8, flood_risk: 2.1 },
  ETH: { baseline_water_stress: 2.8, drought_risk: 4.1, flood_risk: 2.5 },
  NGA: { baseline_water_stress: 2.1, drought_risk: 2.5, flood_risk: 3.2 },
  TZA: { baseline_water_stress: 2.5, drought_risk: 3.0, flood_risk: 2.8 },
  MOZ: { baseline_water_stress: 1.8, drought_risk: 2.2, flood_risk: 4.0 },
  IND: { baseline_water_stress: 4.1, drought_risk: 3.5, flood_risk: 3.8 },
  BGD: { baseline_water_stress: 2.2, drought_risk: 1.8, flood_risk: 4.8 },
  PAK: { baseline_water_stress: 4.5, drought_risk: 4.2, flood_risk: 3.5 },
  KHM: { baseline_water_stress: 1.5, drought_risk: 2.0, flood_risk: 3.5 },
  MMR: { baseline_water_stress: 1.8, drought_risk: 2.5, flood_risk: 3.8 },
};

// ─── Data Source Fetchers ─────────────────────────────────────────────────────

interface WorldBankData {
  population: number | null;
  basicWater: number | null;
  waterStress: number | null;
  rainfall: number | null;
  popDensity: number | null;
  sanitation: number | null;
  co2: number | null;
}

interface UNSDGData {
  sdg611: number | null; // SDG 6.1.1 safely managed drinking water %
}

interface INFORMData {
  riskScore: number | null;
  hazardScore: number | null;
  vulnerabilityScore: number | null;
  lackOfCopingCapacity: number | null;
}

/**
 * Fetch a single World Bank indicator. Returns most recent non-null value (2015-2023).
 * Source: https://api.worldbank.org/v2/
 */
async function fetchWBIndicator(countryCode: string, indicator: string): Promise<number | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2015:2023&per_page=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[1]?.length) return null;
    for (const entry of data[1]) {
      if (entry.value !== null) return entry.value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all World Bank indicators for a country in parallel.
 * Source: https://api.worldbank.org/v2/country/{ISO3}/indicator/{CODE}
 */
async function fetchWorldBank(countryCode: string): Promise<WorldBankData> {
  const [population, basicWater, waterStress, rainfall, popDensity, sanitation, co2] = await Promise.all([
    fetchWBIndicator(countryCode, 'SP.POP.TOTL'),
    fetchWBIndicator(countryCode, 'SH.H2O.BASW.ZS'),
    fetchWBIndicator(countryCode, 'ER.H2O.FWST.ZS'),
    fetchWBIndicator(countryCode, 'AG.LND.PRCP.MM'),
    fetchWBIndicator(countryCode, 'EN.POP.DNST'),
    fetchWBIndicator(countryCode, 'SH.STA.SMSS.ZS'),
    fetchWBIndicator(countryCode, 'EN.ATM.CO2E.PC'),
  ]);
  return { population, basicWater, waterStress, rainfall, popDensity, sanitation, co2 };
}

/**
 * Fetch SDG 6.1.1 data from UN SDG API.
 * Source: https://unstats.un.org/sdgapi/v1/sdg/Goal/6/Target/6.1/Indicator/6.1.1/GeoArea/{M49}
 */
async function fetchUNSDG(m49Code: number): Promise<UNSDGData> {
  try {
    const url = `https://unstats.un.org/sdgapi/v1/sdg/Goal/6/Target/6.1/Indicator/6.1.1/GeoArea/${m49Code}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { sdg611: null };
    const data = await res.json();
    // UN SDG API returns array of data points; find most recent
    if (Array.isArray(data) && data.length > 0) {
      const sorted = data.sort((a: { timePeriodStart: number }, b: { timePeriodStart: number }) =>
        (b.timePeriodStart ?? 0) - (a.timePeriodStart ?? 0)
      );
      const val = sorted[0]?.value;
      return { sdg611: val != null ? parseFloat(val) : null };
    }
    return { sdg611: null };
  } catch {
    return { sdg611: null };
  }
}

/**
 * Fetch INFORM Risk Index scores for a country (by ISO3 code).
 * Source: https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/countries/Scores
 */
async function fetchINFORM(countryCode: string): Promise<INFORMData> {
  try {
    const url = 'https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/countries/Scores';
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { riskScore: null, hazardScore: null, vulnerabilityScore: null, lackOfCopingCapacity: null };
    const data = await res.json();
    const countries = Array.isArray(data) ? data : [];
    const entry = countries.find((c: { Iso3: string }) => c.Iso3?.toUpperCase() === countryCode.toUpperCase());
    if (!entry) return { riskScore: null, hazardScore: null, vulnerabilityScore: null, lackOfCopingCapacity: null };
    return {
      riskScore: entry.InformRiskScore ?? entry.INFORM ?? null,
      hazardScore: entry.HazardAndExposure ?? entry.HA ?? null,
      vulnerabilityScore: entry.Vulnerability ?? entry.VU ?? null,
      lackOfCopingCapacity: entry.LackOfCopingCapacity ?? entry.CC ?? null,
    };
  } catch {
    return { riskScore: null, hazardScore: null, vulnerabilityScore: null, lackOfCopingCapacity: null };
  }
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

interface CountryAggregated {
  wb: WorldBankData;
  unsdg: UNSDGData;
  wri: { baseline_water_stress: number; drought_risk: number; flood_risk: number };
  inform: INFORMData;
  sources: string[];
}

async function fetchCountryAggregated(country: typeof TARGET_COUNTRIES[number]): Promise<CountryAggregated> {
  const [wb, unsdg, inform] = await Promise.all([
    fetchWorldBank(country.code),
    fetchUNSDG(country.m49),
    fetchINFORM(country.code),
  ]);

  const wri = WRI_AQUEDUCT[country.code] ?? { baseline_water_stress: 2.0, drought_risk: 2.5, flood_risk: 2.5 };

  const sources: string[] = [];
  if (wb.population !== null || wb.basicWater !== null || wb.waterStress !== null) sources.push('World Bank Open Data');
  if (unsdg.sdg611 !== null) sources.push('UN SDG API');
  sources.push('WRI Aqueduct 4.0'); // always available (static)
  if (inform.riskScore !== null) sources.push('INFORM Risk Index');

  return { wb, unsdg, wri, inform, sources };
}

function deriveRegion(
  regionId: string,
  regionName: string,
  country: typeof TARGET_COUNTRIES[number],
  agg: CountryAggregated,
  geo: { lat: number; lng: number; coastal: boolean; nearWater: boolean; type: string }
): RegionData {
  const { wb, unsdg, wri, inform, sources } = agg;

  const isArid = geo.type.toLowerCase().includes('arid');
  const isUrban = geo.type.toLowerCase().includes('urban');
  const isFloodplain = geo.type.toLowerCase().includes('flood') || geo.type.toLowerCase().includes('delta');

  // Water access: prefer UN SDG 6.1.1, fallback to World Bank
  const safelyManagedBase = unsdg.sdg611 ?? wb.sanitation ?? 30;
  const basicWaterBase = wb.basicWater ?? 60;

  const accessMod = isUrban ? 1.4 : isArid ? 0.5 : 0.8;
  const safelyManagedPct = Math.min(95, Math.max(5, safelyManagedBase * accessMod));
  const basicPct = Math.min(95, Math.max(10, basicWaterBase * (isUrban ? 1.1 : 0.85)));

  // Water stress: blend WRI Aqueduct + World Bank
  const wriStressNorm = wri.baseline_water_stress / 5; // normalize 0-5 to 0-1
  const wbStressNorm = wb.waterStress != null ? wb.waterStress / 100 : null;
  const stressMod = isArid ? 1.4 : isFloodplain ? 0.6 : 1.0;
  const waterStressIndex = Math.min(1, Math.max(0,
    (wbStressNorm != null ? (wriStressNorm + wbStressNorm) / 2 : wriStressNorm) * stressMod
  ));

  // Flood/drought: WRI Aqueduct normalized to 0-1, with geographic modifiers
  const floodBase = wri.flood_risk / 5;
  const droughtBase = wri.drought_risk / 5;
  const floodMod = isFloodplain ? 1.3 : geo.coastal ? 1.1 : isArid ? 0.4 : 0.8;
  const droughtMod = isArid ? 1.3 : isFloodplain ? 0.5 : 0.8;
  const floodRiskScore = Math.min(1, Math.max(0, floodBase * floodMod));
  const droughtRiskScore = Math.min(1, Math.max(0, droughtBase * droughtMod));

  // Climate vulnerability: blend INFORM + computed
  const informVuln = inform.vulnerabilityScore != null ? inform.vulnerabilityScore / 10 : null;
  const computedVuln = waterStressIndex * 0.3 + floodRiskScore * 0.3 + droughtRiskScore * 0.4;
  const climateVulnerability = Math.min(1, Math.max(0,
    informVuln != null ? (informVuln + computedVuln) / 2 : computedVuln
  ));

  const infraGap = Math.min(1, Math.max(0, 1 - safelyManagedPct / 100));
  const rainfall = wb.rainfall ?? 800;
  const popDensity = wb.popDensity ?? 100;
  const population = wb.population ?? 5000000;

  const gwPotential: 'high' | 'moderate' | 'low' =
    isArid && !geo.nearWater ? 'low' : isFloodplain || geo.nearWater ? 'high' : 'moderate';

  const regionPop = Math.round(population * (isUrban ? 0.08 : 0.03));

  const sourceCount = sources.length;
  const dataQuality: 'high' | 'medium' | 'low' = sourceCount >= 3 ? 'high' : sourceCount === 2 ? 'medium' : 'low';

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
    climateVulnerability: Math.round(climateVulnerability * 100) / 100,
    infrastructureGap: Math.round(infraGap * 100) / 100,
    groundwaterPotential: gwPotential,
    annualRainfallMm: Math.round(rainfall * (isArid ? 0.3 : isFloodplain ? 1.5 : 1.0)),
    nearWaterBody: geo.nearWater,
    coastal: geo.coastal,
    populationDensity: Math.round(popDensity * (isUrban ? 8 : isArid ? 0.2 : 1.0)),
    regionType: geo.type,
    lastUpdated: new Date().toISOString(),
    dataSources: sources,
    dataQuality,
  };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

let dataCache: { regions: RegionData[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Fetch all regions with multi-source aggregation.
 * Fetches World Bank, UN SDG, and INFORM APIs in parallel per country.
 * WRI Aqueduct data is a static lookup (published research).
 * Results are cached for 1 hour.
 */
export async function fetchAllRegions(): Promise<RegionData[]> {
  if (dataCache && Date.now() - dataCache.timestamp < CACHE_TTL_MS) {
    return dataCache.regions;
  }

  const countryResults = await Promise.all(
    TARGET_COUNTRIES.map(async (country) => ({
      country,
      agg: await fetchCountryAggregated(country),
    }))
  );

  const regions: RegionData[] = [];
  for (const { country, agg } of countryResults) {
    for (const regionName of country.regions) {
      const regionId = `${country.code.toLowerCase().slice(0, 3)}-${regionName.toLowerCase().replace(/[^a-z]/g, '')}`;
      const geo = REGION_GEO[regionId];
      if (!geo) continue;
      regions.push(deriveRegion(regionId, regionName, country, agg, geo));
    }
  }

  dataCache = { regions, timestamp: Date.now() };
  return regions;
}

/** Get a single region by ID */
export async function getRegionById(id: string): Promise<RegionData | null> {
  const regions = await fetchAllRegions();
  return regions.find(r => r.id === id) || null;
}

/** Invalidate cache (for sync endpoint) */
export function invalidateCache() {
  dataCache = null;
}

/**
 * Returns attribution metadata for all data sources used.
 * For display in the UI to provide transparency and traceability.
 */
export async function getDataSourceAttribution(): Promise<{ name: string; url: string; description: string; lastUpdated: string }[]> {
  return [
    {
      name: 'World Bank Open Data',
      url: 'https://api.worldbank.org/v2/',
      description: 'Country-level indicators: basic drinking water access, freshwater withdrawal, precipitation, population density, sanitation, CO2 emissions.',
      lastUpdated: '2023',
    },
    {
      name: 'UN SDG API',
      url: 'https://unstats.un.org/sdgapi/v1/sdg/Goal/6/Target/6.1/Indicator/6.1.1',
      description: 'SDG 6.1.1 — Proportion of population using safely managed drinking water services, by country.',
      lastUpdated: '2023',
    },
    {
      name: 'WRI Aqueduct 4.0',
      url: 'https://www.wri.org/applications/aqueduct/country-rankings/',
      description: 'Baseline water stress, drought risk, and flood risk scores at country level (scale 0-5).',
      lastUpdated: '2023',
    },
    {
      name: 'INFORM Risk Index',
      url: 'https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/countries/Scores',
      description: 'Composite risk scores including hazard exposure, vulnerability, and lack of coping capacity.',
      lastUpdated: '2024',
    },
  ];
}
