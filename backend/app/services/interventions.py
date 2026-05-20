"""
Intervention recommendation engine.
Scores suitability of 6 freshwater intervention types for each region
based on geophysical, climatic, and infrastructure characteristics.
"""

from ..models.schemas import InterventionRecommendation, InterventionType, RegionIndicators


COST_BENCHMARKS = {
    InterventionType.borehole: {
        "name": "Groundwater Borehole",
        "cost_per_unit": 30_000,
        "people_per_unit": 1_000,
        "lifespan_years": 25,
        "maintenance_pct": 0.05,
        "reliability": 0.85,
    },
    InterventionType.rainwater_harvesting: {
        "name": "Rainwater Harvesting System",
        "cost_per_unit": 2_000,
        "people_per_unit": 50,
        "lifespan_years": 15,
        "maintenance_pct": 0.03,
        "reliability": 0.70,
    },
    InterventionType.surface_water_treatment: {
        "name": "Surface Water Treatment Plant",
        "cost_per_unit": 1_200_000,
        "people_per_unit": 25_000,
        "lifespan_years": 30,
        "maintenance_pct": 0.08,
        "reliability": 0.92,
    },
    InterventionType.managed_aquifer_recharge: {
        "name": "Managed Aquifer Recharge",
        "cost_per_unit": 500_000,
        "people_per_unit": 10_000,
        "lifespan_years": 40,
        "maintenance_pct": 0.04,
        "reliability": 0.88,
    },
    InterventionType.piped_water_extension: {
        "name": "Piped Water Network Extension",
        "cost_per_unit": 250_000,
        "people_per_unit": 5_000,
        "lifespan_years": 35,
        "maintenance_pct": 0.06,
        "reliability": 0.94,
    },
    InterventionType.desalination: {
        "name": "Desalination Plant (Coastal)",
        "cost_per_unit": 5_000_000,
        "people_per_unit": 50_000,
        "lifespan_years": 25,
        "maintenance_pct": 0.10,
        "reliability": 0.95,
    },
}


def score_borehole(ind: RegionIndicators) -> float:
    return (
        ind.groundwater_potential * 0.35
        + (1 - ind.flood_risk) * 0.20
        + ind.drought_risk * 0.15
        + ind.infrastructure_gap * 0.15
        + ind.water_stress * 0.15
    )


def score_rainwater(ind: RegionIndicators) -> float:
    precip_score = min(1.0, ind.precipitation_mm / 1500)
    return (
        precip_score * 0.35
        + ind.infrastructure_gap * 0.25
        + ind.water_stress * 0.15
        + (1 - ind.drought_risk) * 0.15
        + ind.climate_vulnerability * 0.10
    )


def score_surface_treatment(ind: RegionIndicators) -> float:
    water_body_proxy = min(1.0, ind.precipitation_mm / 1000) * (1 - ind.drought_risk)
    return (
        water_body_proxy * 0.35
        + ind.water_stress * 0.20
        + ind.infrastructure_gap * 0.20
        + (1 - ind.flood_risk) * 0.15
        + (1 - ind.water_access_pct / 100) * 0.10
    )


def score_mar(ind: RegionIndicators) -> float:
    return (
        ind.flood_risk * 0.30
        + ind.groundwater_potential * 0.30
        + min(1.0, ind.precipitation_mm / 1200) * 0.20
        + ind.drought_risk * 0.20
    )


def score_piped(ind: RegionIndicators) -> float:
    return (
        ind.infrastructure_gap * 0.30
        + (1 - ind.water_access_pct / 100) * 0.25
        + (1 - ind.flood_risk) * 0.15
        + ind.water_stress * 0.15
        + (1 - ind.drought_risk) * 0.15
    )


def score_desalination(ind: RegionIndicators, is_coastal: bool) -> float:
    if not is_coastal:
        return 0.0
    return (
        ind.water_stress * 0.35
        + (1 - ind.groundwater_potential) * 0.25
        + ind.infrastructure_gap * 0.20
        + (1 - ind.water_access_pct / 100) * 0.20
    )


SCORERS = {
    InterventionType.borehole: lambda ind, coastal: score_borehole(ind),
    InterventionType.rainwater_harvesting: lambda ind, coastal: score_rainwater(ind),
    InterventionType.surface_water_treatment: lambda ind, coastal: score_surface_treatment(ind),
    InterventionType.managed_aquifer_recharge: lambda ind, coastal: score_mar(ind),
    InterventionType.piped_water_extension: lambda ind, coastal: score_piped(ind),
    InterventionType.desalination: score_desalination,
}


def recommend_interventions(
    indicators: RegionIndicators,
    population: int,
    is_coastal: bool = False,
    top_n: int = 4,
) -> list[InterventionRecommendation]:
    scored = []
    for itype, scorer in SCORERS.items():
        score = scorer(indicators, is_coastal)
        if score < 0.1:
            continue
        bench = COST_BENCHMARKS[itype]
        units_needed = max(1, population // bench["people_per_unit"])
        total_cost = bench["cost_per_unit"] * units_needed
        pop_served = min(population, units_needed * bench["people_per_unit"])

        sustainability = (
            (1 - bench["maintenance_pct"]) * 0.3
            + (bench["lifespan_years"] / 40) * 0.3
            + (1 - indicators.climate_vulnerability) * 0.2
            + score * 0.2
        )

        rationale = _generate_rationale(itype, indicators, score)

        scored.append(
            InterventionRecommendation(
                type=itype,
                name=bench["name"],
                suitability_score=round(score, 3),
                estimated_cost_usd=total_cost,
                population_served=pop_served,
                reliability_score=bench["reliability"],
                sustainability_score=round(sustainability, 3),
                rationale=rationale,
            )
        )

    scored.sort(key=lambda x: x.suitability_score, reverse=True)
    return scored[:top_n]


def _generate_rationale(itype: InterventionType, ind: RegionIndicators, score: float) -> str:
    rationales = {
        InterventionType.borehole: (
            f"Groundwater potential ({ind.groundwater_potential:.0%}) supports borehole "
            f"development. Low flood risk reduces contamination concerns."
        ),
        InterventionType.rainwater_harvesting: (
            f"Annual precipitation ({ind.precipitation_mm:.0f}mm) and community-scale "
            f"infrastructure gap ({ind.infrastructure_gap:.0%}) favor distributed harvesting."
        ),
        InterventionType.surface_water_treatment: (
            f"Available surface water with manageable drought risk ({ind.drought_risk:.0%}). "
            f"Centralized treatment serves dense populations cost-effectively."
        ),
        InterventionType.managed_aquifer_recharge: (
            f"High flood risk ({ind.flood_risk:.0%}) creates recharge opportunity. "
            f"Converts seasonal surplus to year-round groundwater availability."
        ),
        InterventionType.piped_water_extension: (
            f"Infrastructure gap ({ind.infrastructure_gap:.0%}) with existing partial "
            f"network indicates extension is most cost-effective per connection."
        ),
        InterventionType.desalination: (
            f"Coastal location with extreme water stress ({ind.water_stress:.0%}) "
            f"and limited groundwater makes desalination viable despite high cost."
        ),
    }
    return rationales.get(itype, "")
