// src/lib/flood-data.ts
// Real flood event data from GDACS (Global Disaster Alert and Coordination System)
// UN-backed, free, no auth required. Source: GloFAS (Copernicus/EU)

const GDACS_API = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

export interface FloodEvent {
  id: string;
  date: string;
  country: string;
  region?: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  affectedPeople: number;
  description: string;
  source: string;
  sourceUrl: string;
}

export interface FloodRiskProfile {
  regionId: string;
  historicalEvents: FloodEvent[];
  avgEventsPerYear: number;
  avgAffectedPerEvent: number;
  lastMajorFlood: string | null;
  floodFrequencyScore: number;
  floodSeverityScore: number;
  dataSource: string;
}

// ISO 3166-1 alpha-3 codes for GDACS country filter
const COUNTRY_ISO3: Record<string, string> = {
  Kenya: 'KEN', Bangladesh: 'BGD', India: 'IND', Pakistan: 'PAK',
  Mozambique: 'MOZ', Nigeria: 'NGA', Brazil: 'BRA', China: 'CHN',
  Indonesia: 'IDN', Philippines: 'PHL', Thailand: 'THA', Vietnam: 'VNM',
};

function alertToSeverity(alert: string): FloodEvent['severity'] {
  switch (alert) {
    case 'Red': return 'catastrophic';
    case 'Orange': return 'major';
    case 'Green': return 'moderate';
    default: return 'minor';
  }
}

interface GDACSFeature {
  properties: {
    eventid: number;
    episodeid: number;
    name: string;
    description: string;
    alertlevel: string;
    country: string;
    fromdate: string;
    todate: string;
    url: { report: string };
    affectedcountries?: { countryname: string }[];
    severitydata?: { severity: number };
  };
}

function parseGDACS(data: { features?: GDACSFeature[] }): FloodEvent[] {
  if (!data?.features) return [];
  return data.features.map((f) => {
    const p = f.properties;
    return {
      id: `${p.eventid}-${p.episodeid}`,
      date: p.fromdate,
      country: p.country,
      severity: alertToSeverity(p.alertlevel),
      affectedPeople: 0,
      description: p.description || p.name,
      source: 'GDACS (UN/EU - GloFAS)',
      sourceUrl: p.url?.report ?? `https://www.gdacs.org/report.aspx?eventid=${p.eventid}&eventtype=FL`,
    };
  });
}

export async function getFloodEvents(country: string, limit = 20): Promise<FloodEvent[]> {
  const iso3 = COUNTRY_ISO3[country] ?? country;
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0]; // 3 years back
  const url = `${GDACS_API}?eventlist=FL&country=${iso3}&fromDate=${from}&toDate=${to}&alertlevel=Green;Orange;Red`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GDACS API error: ${res.status}`);
  const events = parseGDACS(await res.json());
  return events.slice(0, limit);
}

export async function getRecentFloods(limit = 20): Promise<FloodEvent[]> {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days
  const url = `${GDACS_API}?eventlist=FL&fromDate=${from}&toDate=${to}&alertlevel=Green;Orange;Red`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GDACS API error: ${res.status}`);
  const events = parseGDACS(await res.json());
  return events.slice(0, limit);
}

// EM-DAT published statistics (Source: EM-DAT, CRED, UCLouvain, 2000-2024)
const EMDAT_STATS: Record<string, { events: number; years: number; avgAffected: number }> = {
  Kenya: { events: 47, years: 24, avgAffected: 230000 },
  Bangladesh: { events: 78, years: 24, avgAffected: 5200000 },
  India: { events: 156, years: 24, avgAffected: 12000000 },
  Pakistan: { events: 62, years: 24, avgAffected: 8500000 },
  Mozambique: { events: 34, years: 24, avgAffected: 450000 },
};

export async function getFloodRiskProfile(regionId: string, country: string): Promise<FloodRiskProfile> {
  const events = await getFloodEvents(country, 50);
  const stats = EMDAT_STATS[country];
  const avgPerYear = stats ? stats.events / stats.years : events.length / 3;
  const avgAffected = stats?.avgAffected ?? 0;
  const majorEvents = events.filter((e) => e.severity === 'major' || e.severity === 'catastrophic');

  return {
    regionId,
    historicalEvents: events,
    avgEventsPerYear: Math.round(avgPerYear * 10) / 10,
    avgAffectedPerEvent: avgAffected,
    lastMajorFlood: majorEvents[0]?.date ?? null,
    floodFrequencyScore: Math.min(avgPerYear / 10, 1),
    floodSeverityScore: Math.min(avgAffected / 10000000, 1),
    dataSource: 'GDACS (UN/EU GloFAS) + EM-DAT (CRED, UCLouvain)',
  };
}
