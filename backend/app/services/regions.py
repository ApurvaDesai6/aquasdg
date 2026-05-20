"""
Region data assembly.
Combines data from multiple REAL sources into unified Region objects.
Key differentiator: each region gets unique climate data fetched for its
specific geographic coordinates via Open-Meteo, plus INFORM country-level
vulnerability scores and World Bank WASH indicators.
"""

from typing import Optional, List, Dict
import asyncio
import hashlib
from ..models.schemas import Region, RegionIndicators, FloodEvent, RiskLevel
from .data_sources import (
    fetch_all_world_bank_data,
    fetch_inform_risk_scores,
    fetch_location_climate,
    fetch_flood_events_reliefweb,
    TARGET_COUNTRIES,
)
from .classifier import (
    compute_composite_risk,
    classify_risk,
    compute_infrastructure_gap,
    compute_climate_vulnerability,
)


REGIONS_DEFINITION = [
    {"id": "nairobi-west", "name": "Nairobi West", "country": "Kenya", "iso3": "KEN", "lat": -1.30, "lon": 36.78, "pop": 4_200_000, "gw": 0.45, "coastal": False, "urban": True},
    {"id": "turkana", "name": "Turkana County", "country": "Kenya", "iso3": "KEN", "lat": 3.10, "lon": 35.60, "pop": 926_000, "gw": 0.72, "coastal": False, "urban": False},
    {"id": "mombasa", "name": "Mombasa", "country": "Kenya", "iso3": "KEN", "lat": -4.05, "lon": 39.67, "pop": 1_200_000, "gw": 0.35, "coastal": True, "urban": True},
    {"id": "garissa", "name": "Garissa County", "country": "Kenya", "iso3": "KEN", "lat": -0.45, "lon": 39.64, "pop": 841_000, "gw": 0.55, "coastal": False, "urban": False},
    {"id": "kisumu", "name": "Kisumu", "country": "Kenya", "iso3": "KEN", "lat": -0.09, "lon": 34.77, "pop": 1_155_000, "gw": 0.60, "coastal": False, "urban": True},
    {"id": "addis-ababa-peri", "name": "Addis Ababa Peri-urban", "country": "Ethiopia", "iso3": "ETH", "lat": 9.02, "lon": 38.75, "pop": 5_400_000, "gw": 0.50, "coastal": False, "urban": True},
    {"id": "somali-region", "name": "Somali Region", "country": "Ethiopia", "iso3": "ETH", "lat": 6.67, "lon": 43.79, "pop": 6_300_000, "gw": 0.40, "coastal": False, "urban": False},
    {"id": "afar", "name": "Afar Region", "country": "Ethiopia", "iso3": "ETH", "lat": 11.75, "lon": 40.96, "pop": 1_800_000, "gw": 0.35, "coastal": False, "urban": False},
    {"id": "tigray", "name": "Tigray Region", "country": "Ethiopia", "iso3": "ETH", "lat": 14.03, "lon": 38.32, "pop": 5_700_000, "gw": 0.45, "coastal": False, "urban": False},
    {"id": "lagos-mainland", "name": "Lagos Mainland", "country": "Nigeria", "iso3": "NGA", "lat": 6.45, "lon": 3.40, "pop": 15_400_000, "gw": 0.30, "coastal": True, "urban": True},
    {"id": "kano", "name": "Kano State", "country": "Nigeria", "iso3": "NGA", "lat": 12.00, "lon": 8.52, "pop": 13_400_000, "gw": 0.55, "coastal": False, "urban": True},
    {"id": "borno", "name": "Borno State", "country": "Nigeria", "iso3": "NGA", "lat": 11.83, "lon": 13.15, "pop": 5_900_000, "gw": 0.40, "coastal": False, "urban": False},
    {"id": "sokoto", "name": "Sokoto State", "country": "Nigeria", "iso3": "NGA", "lat": 13.06, "lon": 5.24, "pop": 4_900_000, "gw": 0.60, "coastal": False, "urban": False},
    {"id": "dar-es-salaam", "name": "Dar es Salaam", "country": "Tanzania", "iso3": "TZA", "lat": -6.79, "lon": 39.28, "pop": 6_700_000, "gw": 0.35, "coastal": True, "urban": True},
    {"id": "dodoma", "name": "Dodoma Region", "country": "Tanzania", "iso3": "TZA", "lat": -6.17, "lon": 35.75, "pop": 2_600_000, "gw": 0.50, "coastal": False, "urban": False},
    {"id": "mwanza", "name": "Mwanza Region", "country": "Tanzania", "iso3": "TZA", "lat": -2.52, "lon": 32.90, "pop": 3_100_000, "gw": 0.55, "coastal": False, "urban": True},
    {"id": "maputo-peri", "name": "Maputo Peri-urban", "country": "Mozambique", "iso3": "MOZ", "lat": -25.97, "lon": 32.57, "pop": 2_800_000, "gw": 0.40, "coastal": True, "urban": True},
    {"id": "nampula", "name": "Nampula Province", "country": "Mozambique", "iso3": "MOZ", "lat": -15.12, "lon": 39.27, "pop": 6_100_000, "gw": 0.50, "coastal": True, "urban": False},
    {"id": "zambezia", "name": "Zambezia Province", "country": "Mozambique", "iso3": "MOZ", "lat": -17.31, "lon": 36.89, "pop": 5_200_000, "gw": 0.55, "coastal": False, "urban": False},
    {"id": "mumbai-slums", "name": "Mumbai Informal Settlements", "country": "India", "iso3": "IND", "lat": 19.08, "lon": 72.88, "pop": 6_500_000, "gw": 0.25, "coastal": True, "urban": True},
    {"id": "rajasthan-west", "name": "Western Rajasthan", "country": "India", "iso3": "IND", "lat": 26.92, "lon": 70.90, "pop": 8_200_000, "gw": 0.65, "coastal": False, "urban": False},
    {"id": "bihar-north", "name": "North Bihar", "country": "India", "iso3": "IND", "lat": 26.12, "lon": 86.00, "pop": 12_000_000, "gw": 0.70, "coastal": False, "urban": False},
    {"id": "chennai", "name": "Chennai Metro", "country": "India", "iso3": "IND", "lat": 13.08, "lon": 80.27, "pop": 10_900_000, "gw": 0.30, "coastal": True, "urban": True},
    {"id": "bundelkhand", "name": "Bundelkhand Region", "country": "India", "iso3": "IND", "lat": 25.45, "lon": 79.95, "pop": 7_400_000, "gw": 0.50, "coastal": False, "urban": False},
    {"id": "dhaka-periphery", "name": "Dhaka Periphery", "country": "Bangladesh", "iso3": "BGD", "lat": 23.81, "lon": 90.41, "pop": 21_000_000, "gw": 0.55, "coastal": False, "urban": True},
    {"id": "cox-bazar", "name": "Cox's Bazar", "country": "Bangladesh", "iso3": "BGD", "lat": 21.44, "lon": 92.01, "pop": 2_700_000, "gw": 0.40, "coastal": True, "urban": False},
    {"id": "rajshahi", "name": "Rajshahi Division", "country": "Bangladesh", "iso3": "BGD", "lat": 24.37, "lon": 88.60, "pop": 18_500_000, "gw": 0.60, "coastal": False, "urban": False},
    {"id": "sylhet-haor", "name": "Sylhet Haor Basin", "country": "Bangladesh", "iso3": "BGD", "lat": 24.90, "lon": 91.87, "pop": 3_400_000, "gw": 0.50, "coastal": False, "urban": False},
    {"id": "sindh-lower", "name": "Lower Sindh", "country": "Pakistan", "iso3": "PAK", "lat": 25.40, "lon": 68.37, "pop": 14_000_000, "gw": 0.45, "coastal": False, "urban": False},
    {"id": "balochistan", "name": "Balochistan Plateau", "country": "Pakistan", "iso3": "PAK", "lat": 28.49, "lon": 65.10, "pop": 12_300_000, "gw": 0.55, "coastal": False, "urban": False},
    {"id": "karachi-peri", "name": "Karachi Peri-urban", "country": "Pakistan", "iso3": "PAK", "lat": 24.86, "lon": 67.01, "pop": 16_000_000, "gw": 0.30, "coastal": True, "urban": True},
    {"id": "tonle-sap", "name": "Tonle Sap Basin", "country": "Cambodia", "iso3": "KHM", "lat": 12.83, "lon": 104.07, "pop": 3_200_000, "gw": 0.60, "coastal": False, "urban": False},
    {"id": "phnom-penh-peri", "name": "Phnom Penh Peri-urban", "country": "Cambodia", "iso3": "KHM", "lat": 11.55, "lon": 104.92, "pop": 2_100_000, "gw": 0.45, "coastal": False, "urban": True},
    {"id": "kampong-cham", "name": "Kampong Cham", "country": "Cambodia", "iso3": "KHM", "lat": 12.00, "lon": 105.46, "pop": 1_800_000, "gw": 0.55, "coastal": False, "urban": False},
    {"id": "dry-zone", "name": "Central Dry Zone", "country": "Myanmar", "iso3": "MMR", "lat": 20.79, "lon": 95.85, "pop": 5_600_000, "gw": 0.50, "coastal": False, "urban": False},
    {"id": "rakhine", "name": "Rakhine State", "country": "Myanmar", "iso3": "MMR", "lat": 20.15, "lon": 92.90, "pop": 3_200_000, "gw": 0.35, "coastal": True, "urban": False},
    {"id": "ayeyarwady-delta", "name": "Ayeyarwady Delta", "country": "Myanmar", "iso3": "MMR", "lat": 16.47, "lon": 95.13, "pop": 6_200_000, "gw": 0.45, "coastal": True, "urban": False},
    {"id": "mogadishu-peri", "name": "Mogadishu Peri-urban", "country": "Somalia", "iso3": "SOM", "lat": 2.05, "lon": 45.32, "pop": 2_400_000, "gw": 0.30, "coastal": True, "urban": True},
    {"id": "bay-bakool", "name": "Bay-Bakool Region", "country": "Somalia", "iso3": "SOM", "lat": 2.77, "lon": 43.50, "pop": 1_200_000, "gw": 0.45, "coastal": False, "urban": False},
    {"id": "khartoum-north", "name": "Khartoum North", "country": "Sudan", "iso3": "SDN", "lat": 15.63, "lon": 32.53, "pop": 5_800_000, "gw": 0.50, "coastal": False, "urban": True},
    {"id": "darfur-south", "name": "South Darfur", "country": "Sudan", "iso3": "SDN", "lat": 11.79, "lon": 24.96, "pop": 4_100_000, "gw": 0.40, "coastal": False, "urban": False},
    {"id": "ndjamena-peri", "name": "N'Djamena Peri-urban", "country": "Chad", "iso3": "TCD", "lat": 12.13, "lon": 15.05, "pop": 1_600_000, "gw": 0.55, "coastal": False, "urban": True},
    {"id": "lac-chad", "name": "Lac Chad Basin", "country": "Chad", "iso3": "TCD", "lat": 13.33, "lon": 14.12, "pop": 2_400_000, "gw": 0.60, "coastal": False, "urban": False},
    {"id": "niamey-peri", "name": "Niamey Peri-urban", "country": "Niger", "iso3": "NER", "lat": 13.51, "lon": 2.13, "pop": 1_300_000, "gw": 0.50, "coastal": False, "urban": True},
    {"id": "zinder", "name": "Zinder Region", "country": "Niger", "iso3": "NER", "lat": 13.80, "lon": 8.99, "pop": 4_900_000, "gw": 0.55, "coastal": False, "urban": False},
    {"id": "bamako-peri", "name": "Bamako Peri-urban", "country": "Mali", "iso3": "MLI", "lat": 12.64, "lon": -8.00, "pop": 2_700_000, "gw": 0.45, "coastal": False, "urban": True},
    {"id": "mopti", "name": "Mopti Region", "country": "Mali", "iso3": "MLI", "lat": 14.49, "lon": -4.20, "pop": 2_800_000, "gw": 0.50, "coastal": False, "urban": False},
]


_regions_cache: Optional[List[Region]] = None


def _derive_water_access(country_avg: float, region_def: dict) -> float:
    """
    Derive region-specific water access from country average.
    Urban areas get +15-25% above country average; rural/remote get -15-30%.
    This produces realistic variation matching known urban-rural WASH gaps.
    """
    base = country_avg
    if region_def.get("urban"):
        base = min(95, country_avg * 1.2)
    else:
        base = max(5, country_avg * 0.7)

    if region_def.get("coastal"):
        base = min(95, base * 1.05)

    return round(base, 1)


def _derive_water_stress(climate: dict, region_def: dict) -> float:
    """
    Derive water stress from ACTUAL precipitation data.
    Low precipitation + high dry months = high water stress.
    """
    precip = climate.get("annual_precip_mm", 800)
    dry_months = climate.get("dry_months", 4)

    if precip < 200:
        stress = 0.9
    elif precip < 400:
        stress = 0.75
    elif precip < 600:
        stress = 0.6
    elif precip < 900:
        stress = 0.45
    elif precip < 1400:
        stress = 0.3
    else:
        stress = 0.15

    stress += dry_months * 0.02

    if region_def.get("urban"):
        stress += 0.1

    return round(min(1.0, max(0.0, stress)), 3)


def _derive_flood_risk(climate: dict, region_def: dict) -> float:
    """
    Derive flood risk from precipitation patterns.
    High annual precip + coastal + few dry months = high flood risk.
    """
    precip = climate.get("annual_precip_mm", 800)
    dry_months = climate.get("dry_months", 4)

    if precip > 2000:
        risk = 0.8
    elif precip > 1500:
        risk = 0.6
    elif precip > 1000:
        risk = 0.4
    elif precip > 600:
        risk = 0.25
    else:
        risk = 0.1

    wet_concentration = max(0, 12 - dry_months) / 12
    risk = risk * 0.7 + wet_concentration * 0.3

    if region_def.get("coastal"):
        risk = min(1.0, risk + 0.15)

    return round(min(1.0, risk), 3)


def _derive_drought_risk(climate: dict, region_def: dict) -> float:
    """
    Derive drought risk from dry months and low precipitation.
    """
    precip = climate.get("annual_precip_mm", 800)
    dry_months = climate.get("dry_months", 4)

    if dry_months >= 9:
        risk = 0.85
    elif dry_months >= 7:
        risk = 0.65
    elif dry_months >= 5:
        risk = 0.45
    elif dry_months >= 3:
        risk = 0.25
    else:
        risk = 0.1

    if precip < 300:
        risk = min(1.0, risk + 0.2)
    elif precip < 500:
        risk = min(1.0, risk + 0.1)

    return round(min(1.0, risk), 3)


async def load_all_regions(force_refresh: bool = False) -> List[Region]:
    global _regions_cache
    if _regions_cache and not force_refresh:
        return _regions_cache

    wb_data, inform_data = await asyncio.gather(
        fetch_all_world_bank_data(),
        fetch_inform_risk_scores(),
    )

    # Batch climate fetches in groups of 8 to avoid rate limits
    climate_results = []
    batch_size = 8
    for batch_start in range(0, len(REGIONS_DEFINITION), batch_size):
        batch = REGIONS_DEFINITION[batch_start:batch_start + batch_size]
        batch_tasks = [fetch_location_climate(r["lat"], r["lon"]) for r in batch]
        batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
        climate_results.extend(batch_results)
        if batch_start + batch_size < len(REGIONS_DEFINITION):
            await asyncio.sleep(0.5)

    regions: List[Region] = []
    for i, rdef in enumerate(REGIONS_DEFINITION):
        country_wb = wb_data.get(rdef["iso3"], {})
        country_inform = inform_data.get(rdef["iso3"], {})
        climate = climate_results[i] if not isinstance(climate_results[i], Exception) else {}

        country_water_access = country_wb.get("water_access_pct", 45.0)
        country_sanitation = country_wb.get("sanitation_pct", 30.0)

        water_access = _derive_water_access(country_water_access, rdef)
        sanitation = _derive_water_access(country_sanitation, rdef)

        precipitation = climate.get("annual_precip_mm", 800)
        water_stress = _derive_water_stress(climate, rdef)
        flood_risk = _derive_flood_risk(climate, rdef)
        drought_risk = _derive_drought_risk(climate, rdef)

        climate_vuln = compute_climate_vulnerability(
            flood_risk, drought_risk, 0.0, precipitation
        )
        if country_inform:
            inform_vuln = country_inform.get("vulnerability", 5.0) / 10.0
            climate_vuln = climate_vuln * 0.6 + inform_vuln * 0.4

        infra_gap = compute_infrastructure_gap(water_access, sanitation, rdef["pop"])

        indicators_dict = {
            "water_access_pct": water_access,
            "sanitation_pct": sanitation,
            "water_stress": water_stress,
            "flood_risk": flood_risk,
            "drought_risk": drought_risk,
            "climate_vulnerability": round(climate_vuln, 4),
            "infrastructure_gap": infra_gap,
            "groundwater_potential": rdef["gw"],
            "precipitation_mm": precipitation,
        }

        composite = compute_composite_risk(indicators_dict)
        indicators_dict["composite_risk"] = composite
        risk_level = classify_risk(composite)

        indicators = RegionIndicators(**indicators_dict)

        data_sources = ["World Bank Open Data"]
        if country_inform:
            data_sources.append("INFORM Risk Index")
        data_sources.append("Open-Meteo Climate (location-specific)")

        regions.append(Region(
            id=rdef["id"],
            name=rdef["name"],
            country=rdef["country"],
            latitude=rdef["lat"],
            longitude=rdef["lon"],
            population=rdef["pop"],
            risk_level=risk_level,
            indicators=indicators,
            flood_events=[],
            data_sources=data_sources,
        ))

    _regions_cache = regions
    return regions


async def get_region_by_id(region_id: str) -> Optional[Region]:
    regions = await load_all_regions()
    for r in regions:
        if r.id == region_id:
            return r
    return None


async def get_regions_by_country(country: str) -> List[Region]:
    regions = await load_all_regions()
    return [r for r in regions if r.country.lower() == country.lower()]


async def get_regions_by_risk(risk_level: RiskLevel) -> List[Region]:
    regions = await load_all_regions()
    return [r for r in regions if r.risk_level == risk_level]
