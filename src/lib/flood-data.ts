// src/lib/flood-data.ts
// Real flood event data from UN OCHA ReliefWeb API (free, no auth required)

const RELIEFWEB_API = 'https://api.reliefweb.int/v1/disasters';

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

interface ReliefWebDisaster {
  id: string;
  fields: {
    name: string;
    date?: { created?: string };
    country?: { name: string }[];
    type?: { name: string }[];
    description?: string;
    status?: string;
  };
}

function inferSeverity(name: string): FloodEvent['severity'] {
  const lower = name.toLowerCase();
  if (lower.includes('catastroph') || lower.includes('devastating')) return 'catastrophic';
  if (lower.includes('severe') || lower.includes('major') || lower.includes('deadly')) return 'major';
  if (lower.includes('minor') || lower.includes('small')) return 'minor';
  return 'moderate';
}

function parseReliefWebResponse(data: { data?: ReliefWebDisaster[] }): FloodEvent[] {
  if (!data?.data) return [];
  return data.data.map((item) => ({
    id: String(item.id),
    date: item.fields.date?.created ?? '',
    country: item.fields.country?.[0]?.name ?? 'Unknown',
    severity: inferSeverity(item.fields.name),
    affectedPeople: 0, // ReliefWeb disasters endpoint doesn't include affected count
    description: item.fields.name,
    source: 'UN OCHA ReliefWeb',
    sourceUrl: `https://reliefweb.int/disaster/${item.id}`,
  }));
}

export async function getFloodEvents(country: string, limit = 20): Promise<FloodEvent[]> {
  const url = `${RELIEFWEB_API}?appname=aquasdg&filter[field]=type&filter[value]=Flood&filter[field]=country&filter[value]=${encodeURIComponent(country)}&limit=${limit}&sort[]=date:desc&fields[include][]=name&fields[include][]=date&fields[include][]=country&fields[include][]=type&fields[include][]=status`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ReliefWeb API error: ${res.status}`);
  return parseReliefWebResponse(await res.json());
}

export async function getRecentFloods(limit = 20): Promise<FloodEvent[]> {
  const url = `${RELIEFWEB_API}?appname=aquasdg&filter[field]=type&filter[value]=Flood&limit=${limit}&sort[]=date:desc&fields[include][]=name&fields[include][]=date&fields[include][]=country&fields[include][]=type&fields[include][]=status`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ReliefWeb API error: ${res.status}`);
  return parseReliefWebResponse(await res.json());
}

// EM-DAT published statistics for flood risk scoring
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
  const avgPerYear = stats ? stats.events / stats.years : events.length / 5;
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
    dataSource: 'UN OCHA ReliefWeb + EM-DAT (CRED, UCLouvain)',
  };
}
