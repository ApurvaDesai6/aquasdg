export interface WaterInfrastructure {
  regionId: string;
  totalWaterPoints: number;
  wells: number;
  waterTowers: number;
  drinkingWaterTaps: number;
  pumpingStations: number;
  peoplePerWaterPoint: number;
  coverageRating: 'adequate' | 'strained' | 'critical' | 'severely_lacking';
  dataSource: string;
  queryBbox: { south: number; west: number; north: number; east: number };
  lastQueried: string;
}

const cache = new Map<string, { data: WaterInfrastructure; ts: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCoverageRating(ratio: number): WaterInfrastructure['coverageRating'] {
  if (ratio < 500) return 'adequate';
  if (ratio < 2000) return 'strained';
  if (ratio < 10000) return 'critical';
  return 'severely_lacking';
}

async function queryOverpass(tags: string[], bbox: { south: number; west: number; north: number; east: number }): Promise<number[]> {
  const nodes = tags.map((tag) => {
    const [key, value] = tag.split('=');
    return `node["${key}"="${value}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
  });
  // Query each tag separately with out count to get individual counts
  const counts: number[] = [];
  for (const tag of tags) {
    const [key, value] = tag.split('=');
    const query = `[out:json][timeout:25];node["${key}"="${value}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AquaSDG/1.0 (water-infrastructure-mapping)' } });
    if (!res.ok) throw new Error(`Overpass API error: ${res.status} for ${tag}`);
    const json = await res.json();
    const count = json.elements?.[0]?.tags?.total ? parseInt(json.elements[0].tags.total, 10) : 0;
    counts.push(count);
  }
  return counts;
}

export async function getWaterInfrastructure(lat: number, lng: number, regionId: string, population: number): Promise<WaterInfrastructure> {
  const cached = cache.get(regionId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const bbox = { south: lat - 0.25, west: lng - 0.25, north: lat + 0.25, east: lng + 0.25 };

  const tags = ['amenity=drinking_water', 'man_made=water_well', 'man_made=water_tower', 'man_made=pumping_station'];
  const [drinkingWaterTaps, wells, waterTowers, pumpingStations] = await queryOverpass(tags, bbox);

  const totalWaterPoints = drinkingWaterTaps + wells + waterTowers + pumpingStations;
  const peoplePerWaterPoint = totalWaterPoints > 0 ? Math.round(population / totalWaterPoints) : population;

  const data: WaterInfrastructure = {
    regionId,
    totalWaterPoints,
    wells,
    waterTowers,
    drinkingWaterTaps,
    pumpingStations,
    peoplePerWaterPoint,
    coverageRating: getCoverageRating(peoplePerWaterPoint),
    dataSource: 'OpenStreetMap Overpass API',
    queryBbox: bbox,
    lastQueried: new Date().toISOString(),
  };

  cache.set(regionId, { data, ts: Date.now() });
  return data;
}

export async function getBatchInfrastructure(regions: { id: string; lat: number; lng: number; population: number }[]): Promise<WaterInfrastructure[]> {
  const results: WaterInfrastructure[] = [];
  for (let i = 0; i < regions.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    results.push(await getWaterInfrastructure(regions[i].lat, regions[i].lng, regions[i].id, regions[i].population));
  }
  return results;
}
