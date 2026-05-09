# AquaSDG v2 Revamp — Engineering Roadmap

## The Problem With Current State
It's a glorified spreadsheet viewer. Fetches country-level averages from World Bank, splits them into fake "regions" with random modifiers, and displays them. A kindergartener with Google Sheets could do this.

## What It Needs To Be
A **Google-powered geospatial intelligence platform** that uses Google's actual Earth observation data, flood forecasting, and climate APIs to provide analysis that doesn't exist anywhere else. The value prop: "We combine Google Earth Engine satellite imagery, Google Flood Hub forecasts, and BigQuery public datasets to identify where water infrastructure investment has the highest impact per dollar."

## Core Google Data Sources (requires GCP project + API key, user has both)

### 1. Google Earth Engine (via REST API)
- **What**: Satellite-derived data — actual observed water body extent, vegetation health (NDVI as drought proxy), land surface temperature
- **API**: https://earthengine.googleapis.com/v1/projects/{project}/value:compute
- **Datasets**:
  - `JRC/GSW1_4/GlobalSurfaceWater` — actual water body changes over 38 years (where water is appearing/disappearing)
  - `UCSB-CHG/CHIRPS/DAILY` — precipitation time series at 5km resolution
  - `MODIS/061/MOD11A1` — land surface temperature (drought indicator)
  - `COPERNICUS/S2_SR_HARMONIZED` — Sentinel-2 imagery for land use change
- **What this enables**: "This region lost 40% of its surface water between 2015-2024" — that's a real insight no spreadsheet gives you

### 2. Google Flood Hub API
- **What**: ML-based flood forecasting for rivers globally
- **API**: https://floodhub.google.com/api (public, documented)
- **What this enables**: Real-time and historical flood events, forecast data, affected population estimates
- **Display**: Animated flood risk timeline, historical flood frequency analysis

### 3. Google BigQuery Public Datasets
- **What**: Massive public datasets queryable via SQL
- **Datasets**:
  - `bigquery-public-data.geo_openstreetmap` — every water point, well, pump mapped globally
  - `bigquery-public-data.noaa_gsod` — weather station data (rainfall, temperature)
  - `bigquery-public-data.ghcn_d` — daily climate observations
- **What this enables**: "There are 47 mapped water points serving 2.3M people in this region" — real infrastructure counts from OSM

### 4. Google Maps Platform
- **What**: Not just display — use the Geocoding, Places, and Elevation APIs
- **Display**: Proper satellite/terrain base map, elevation profiles for gravity-fed systems, distance calculations for piped water extension cost modeling

## What Makes This Actually Impressive

### Feature 1: Satellite Water Change Detection
- Show actual satellite-observed surface water changes per region over 10 years
- Animated timeline: watch lakes shrink, rivers change course
- Quantified: "Region X lost 12.3 km² of surface water since 2015"
- This is REAL data from space, not a number from a spreadsheet

### Feature 2: Infrastructure Gap Mapping
- Query BigQuery OSM data: count actual water points per region
- Calculate: people per water point (overcrowding indicator)
- Overlay on map: areas with no water infrastructure within 5km
- "There are 23 water points serving 890,000 people — that's 38,700 people per point"

### Feature 3: Flood Forecast Integration
- Pull Google Flood Hub data for rivers in each region
- Show: historical flood frequency, predicted next flood window
- Analysis: "This region floods every 2.3 years on average. Next predicted event: monsoon 2026"
- Investment implication: "Don't build boreholes in the floodplain — use MAR instead"

### Feature 4: Climate Trend Analysis (from actual satellite data)
- CHIRPS precipitation trends: is rainfall increasing or decreasing?
- LST trends: is the region getting hotter?
- NDVI trends: is vegetation dying (drought proxy)?
- Projection: "At current trajectory, this region transitions from moderate to high water stress by 2028"

### Feature 5: Smart Investment Modeling
- Combine all the above: satellite water loss + infrastructure gaps + flood risk + climate trends
- Output: "Here are the 5 regions where $1M has the highest impact, accounting for climate trajectory and flood risk"
- This is the thing no one else can do because no one else combines these sources

## Implementation Priority

### Session 1: Google Earth Engine + BigQuery integration
- Set up GCP auth in the data layer (env var: GOOGLE_APPLICATION_CREDENTIALS or API key)
- Add Earth Engine REST API calls for surface water change detection
- Add BigQuery queries for OSM water infrastructure counts
- New API routes: /api/regions/[id]/satellite, /api/regions/[id]/infrastructure

### Session 2: Visualization overhaul
- Replace the basic map with Google Maps Platform (satellite imagery base)
- Add layer toggles: water stress heatmap, infrastructure points, flood zones
- Region deep-dive: time-series charts of satellite-observed changes
- Animated water change timeline

### Session 3: Analysis engine
- Trend computation from time-series data
- Climate projection modeling
- Peer clustering and benchmarking
- Smart investment recommendations that account for all factors

### Session 4: Polish and export
- Methodology page with full transparency
- PDF export of analysis
- Shareable URLs
- Mobile responsive

## Environment Variables Needed on Vercel
```
GOOGLE_MAPS_API_KEY=       # Maps JavaScript API + Geocoding
GCP_PROJECT_ID=            # For Earth Engine and BigQuery
GOOGLE_API_KEY=            # General Google API key (or service account JSON)
GEMINI_API_KEY=            # For AI-powered policy briefs
```

## Technical Architecture
```
Google Earth Engine API ──┐
Google Flood Hub API ─────┤
BigQuery Public Data ─────┼──▶ src/lib/google-data.ts ──▶ API Routes ──▶ Frontend
Google Maps Platform ─────┤
World Bank API ───────────┤
INFORM Risk Index ────────┘
```
