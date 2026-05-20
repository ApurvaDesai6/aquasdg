from fastapi import APIRouter
from ..services.regions import load_all_regions

router = APIRouter(prefix="/api", tags=["statistics"])


@router.get("/statistics")
async def get_statistics():
    regions = await load_all_regions()
    total_pop = sum(r.population for r in regions)
    unserved = sum(
        int(r.population * (1 - r.indicators.water_access_pct / 100))
        for r in regions
    )
    countries = list(set(r.country for r in regions))

    risk_dist = {"critical": 0, "high": 0, "moderate": 0, "low": 0}
    for r in regions:
        risk_dist[r.risk_level.value] += 1

    avg_stress = sum(r.indicators.water_stress for r in regions) / len(regions)
    avg_access = sum(r.indicators.water_access_pct for r in regions) / len(regions)

    return {
        "total_regions": len(regions),
        "total_countries": len(countries),
        "countries": sorted(countries),
        "total_population": total_pop,
        "population_unserved": unserved,
        "risk_distribution": risk_dist,
        "avg_water_stress": round(avg_stress, 3),
        "avg_water_access_pct": round(avg_access, 1),
        "data_sources": [
            {"name": "World Bank Open Data", "status": "active", "coverage": "15 countries"},
            {"name": "WRI Aqueduct 4.0", "status": "active", "coverage": "Global water stress"},
            {"name": "INFORM Risk Index", "status": "active", "coverage": "Global vulnerability"},
            {"name": "Google Gemini", "status": "active", "coverage": "Policy synthesis"},
            {"name": "ReliefWeb", "status": "active", "coverage": "Flood events"},
        ],
    }


@router.get("/countries")
async def get_countries():
    regions = await load_all_regions()
    countries = {}
    for r in regions:
        if r.country not in countries:
            countries[r.country] = {"name": r.country, "region_count": 0, "total_population": 0}
        countries[r.country]["region_count"] += 1
        countries[r.country]["total_population"] += r.population
    return list(countries.values())
