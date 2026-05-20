# AquaSDG v3 — AI-Powered Freshwater Access Intelligence

A unified intelligence platform synthesizing satellite, climate, and infrastructure data across **47 regions in 15 countries** to identify at-risk communities and simulate optimal freshwater interventions.

## What This Does

AquaSDG ingests real data from multiple public sources, runs ML-based risk classification and intervention scoring, and provides an interactive Bloomberg-terminal-style interface for policymakers to explore water security intelligence.

### Data Sources (Live)
- **World Bank Open Data** — Country-level water access, sanitation, population
- **INFORM Risk Index** — Hazard, vulnerability, coping capacity scores
- **Open-Meteo Historical API** — Location-specific precipitation, temperature (unique per region's coordinates)
- **NASA POWER** — Satellite-derived evapotranspiration and solar radiation
- **ReliefWeb OCHA** — Flood disaster event history

### Analysis Engine
- **Risk Classification** — Composite scoring from 6 weighted indicators with automatic critical/high/moderate/low categorization
- **Intervention Recommendation** — Suitability scoring for 6 intervention types (boreholes, rainwater harvesting, surface treatment, MAR, piped extension, desalination) based on geophysical characteristics
- **Budget Simulation** — Constrained optimization allocating budgets across regions/interventions to maximize population served
- **Gemini AI Agent** — Freeform natural-language research queries answered with full data context

### Frontend
- Interactive map with risk-zone visualization, heatmap density, and cluster modes
- Sortable data table with 47 regions and 6 key metrics
- Scatter plot (stress × infrastructure gap) for compound crisis identification
- Country comparison bars
- Region detail panel with radar chart, AI insights, intervention recommendations
- AI research agent with contextual queries
- Scenario simulator with budget slider and priority optimization

## Architecture

```
frontend/          Next.js 16 + React 19 + MapLibre + Recharts + Zustand
backend/           FastAPI + Python ML engine + Gemini integration
  app/
    routers/       REST API endpoints
    services/      Data ingestion, classifier, interventions, simulation, Gemini
    models/        Pydantic schemas
```

## Quick Start

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
uvicorn app.main:app --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
- `GEMINI_API_KEY` — Google Gemini API key for AI features
- `GCP_PROJECT_ID` — GCP project (default: aquasdg)
- `GOOGLE_MAPS_API_KEY` — Optional, for future Maps Platform features

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — Backend URL (default: http://localhost:8000)

## Deployment

- **Frontend**: Vercel (set `NEXT_PUBLIC_API_URL` env var to backend URL)
- **Backend**: Railway / Render / Fly.io (any Python hosting with env vars)

## Key Metrics (Live Data)

| Metric | Value |
|--------|-------|
| Regions monitored | 47 |
| Countries | 15 |
| Population covered | 278M |
| Population unserved | 158M |
| Unique precipitation values | 34+ (per-location satellite data) |
| Data sources | 5 (live APIs) |
