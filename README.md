# AquaSDG — AI-Powered Water Security Intelligence Platform

AquaSDG is a full-stack water security intelligence platform that combines real-time data, machine learning, and geospatial visualization to support UN Sustainable Development Goal 6 (Clean Water and Sanitation). It provides risk classification, intervention recommendations, policy intelligence workflows, and flood event monitoring for freshwater access analysis worldwide.

## Architecture

```
Browser ──► Caddy (:81) ──┬──► Next.js Frontend (:3000)
                          └──► FastAPI ML Service (:3001)
                                  │
                          ┌───────┼───────┐
                          ▼       ▼       ▼
                      Parquet  SQLite  Google APIs
                      (2.6M)  (Prisma) (FloodHub, Earth Engine)
```

- **Frontend**: Next.js 16 + React 19, MapLibre GL for geospatial maps, Zustand for state, shadcn/ui + Tailwind CSS, Recharts for data viz
- **ML Service**: Python FastAPI serving risk classification, intervention recommendations, and data APIs
- **Database**: Prisma ORM with SQLite for application data
- **Reverse Proxy**: Caddy for routing frontend and API traffic
- **Data Sources**: 2.6M-record groundsource parquet file, Google FloodHub API, Google Earth Engine

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI Components | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Maps | MapLibre GL JS |
| State Management | Zustand |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| ML Service | Python, FastAPI, pandas |
| Database | SQLite via Prisma |
| Reverse Proxy | Caddy |
| Auth | NextAuth.js |

## Prerequisites

- **Node.js** 20+ (or Bun)
- **Python** 3.11+
- **Caddy** (optional, for reverse proxy)

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
# or
bun install
```

### 2. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 3. Install ML service dependencies

```bash
cd mini-services/ml-service
pip install -r requirements.txt  # or install fastapi, uvicorn, pandas, pyarrow
cd ../..
```

### 4. Configure environment

Create a `.env` file in the project root:

```env
# Required
DATABASE_URL="file:./prisma/dev.db"

# Optional — for Google API integration
GOOGLE_API_KEY=your_api_key
GOOGLE_APPLICATION_CREDENTIALS=mini-services/ml-service/service-account.json
```

### 5. Run development servers

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — ML Service
cd mini-services/ml-service
uvicorn index:app --host 0.0.0.0 --port 3001 --reload
```

The frontend runs on `http://localhost:3000` and the ML service on `http://localhost:3001`.

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/
│   │   ├── aquasdg/      # Platform-specific components (map, sidebars, policy intelligence)
│   │   └── ui/           # shadcn/ui component library
│   ├── hooks/            # Custom React hooks
│   └── lib/
│       ├── aquasdg/      # Platform utilities and configs
│       ├── aquasdg-data.ts   # Region data and indicator configs
│       └── aquasdg-store.ts  # Zustand global state
├── mini-services/
│   └── ml-service/       # Python FastAPI ML service
│       ├── index.py      # API endpoints
│       ├── classifier.py # Risk classification model
│       ├── data.py       # Data layer
│       ├── interventions.py  # Intervention recommendation engine
│       └── models.py     # Pydantic data models
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── Caddyfile             # Caddy reverse proxy config
└── package.json
```

## SDG 6 Alignment

AquaSDG tracks nine water-related indicators aligned with UN SDG 6 targets:

- **Composite Risk** — overall water security risk score
- **Water Access** — safe drinking water availability (SDG 6.1)
- **Sanitation** — sanitation service coverage (SDG 6.2)
- **Water Stress** — freshwater withdrawal ratio (SDG 6.4)
- **Flood Risk** — flood hazard and exposure (SDG 6.6)
- **Drought Risk** — drought severity and frequency
- **Climate Vulnerability** — climate change impact on water systems
- **Infrastructure Gap** — water infrastructure deficit
- **Policy Vector** — policy readiness and governance capacity

## License

All rights reserved. License TBD.
