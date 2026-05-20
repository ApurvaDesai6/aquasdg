"""
Budget-constrained intervention optimization engine.
Given a total budget, allocates across regions and intervention types
to maximize population gaining water access.
"""

from typing import List
from ..models.schemas import (
    SimulationRequest,
    SimulationResult,
    RegionAllocation,
    Region,
)
from .interventions import COST_BENCHMARKS, recommend_interventions


def run_simulation(
    request: SimulationRequest,
    regions: List[Region],
) -> SimulationResult:
    target_regions = regions
    if request.target_regions:
        target_regions = [r for r in regions if r.id in request.target_regions]

    if not target_regions:
        target_regions = regions

    candidates = _build_candidates(target_regions, request.priority)
    allocations = _greedy_allocate(candidates, request.budget_usd)

    total_pop = sum(a.population_impact for a in allocations)
    allocated = sum(a.allocated_usd for a in allocations)
    avg_cost = allocated / total_pop if total_pop > 0 else 0

    total_unserved = sum(
        int(r.population * (1 - r.indicators.water_access_pct / 100))
        for r in target_regions
    )
    sdg6_progress = (total_pop / total_unserved * 100) if total_unserved > 0 else 0

    return SimulationResult(
        total_budget=request.budget_usd,
        allocated_budget=round(allocated, 2),
        time_horizon_years=request.time_horizon_years,
        priority=request.priority,
        total_population_served=total_pop,
        regions_covered=len(set(a.region_id for a in allocations)),
        allocations=allocations,
        cost_per_person_avg=round(avg_cost, 2),
        sdg6_progress_pct=round(min(100, sdg6_progress), 2),
    )


def _build_candidates(regions: List[Region], priority: str) -> List[dict]:
    candidates = []
    for region in regions:
        recommendations = recommend_interventions(
            region.indicators,
            region.population,
            is_coastal=_is_coastal(region),
            top_n=3,
        )
        for rec in recommendations:
            bench = COST_BENCHMARKS[rec.type]
            units_needed = max(1, region.population // bench["people_per_unit"])
            unit_cost = bench["cost_per_unit"]
            pop_per_unit = bench["people_per_unit"]

            priority_score = _compute_priority_score(
                priority, region, rec, unit_cost, pop_per_unit
            )

            candidates.append({
                "region": region,
                "intervention": rec,
                "unit_cost": unit_cost,
                "pop_per_unit": pop_per_unit,
                "max_units": units_needed,
                "priority_score": priority_score,
            })

    candidates.sort(key=lambda c: c["priority_score"], reverse=True)
    return candidates


def _compute_priority_score(priority, region, rec, unit_cost, pop_per_unit) -> float:
    if priority == "population":
        return rec.suitability_score * pop_per_unit / unit_cost * 1000
    elif priority == "cost_effectiveness":
        return pop_per_unit / unit_cost * rec.suitability_score
    elif priority == "sustainability":
        return rec.sustainability_score * rec.suitability_score
    elif priority == "equity":
        risk_weight = {"critical": 4, "high": 3, "moderate": 2, "low": 1}
        return risk_weight.get(region.risk_level.value, 1) * rec.suitability_score
    return rec.suitability_score


def _greedy_allocate(candidates: List[dict], budget: float) -> List[RegionAllocation]:
    allocations = []
    remaining = budget
    allocated_regions = {}

    for candidate in candidates:
        if remaining <= 0:
            break

        region = candidate["region"]
        if region.id in allocated_regions and allocated_regions[region.id] >= 2:
            continue

        units_affordable = int(remaining // candidate["unit_cost"])
        units = min(units_affordable, candidate["max_units"])
        if units <= 0:
            continue

        cost = units * candidate["unit_cost"]
        pop_served = units * candidate["pop_per_unit"]
        pop_served = min(pop_served, region.population)

        allocations.append(
            RegionAllocation(
                region_id=region.id,
                region_name=region.name,
                country=region.country,
                intervention=candidate["intervention"].name,
                allocated_usd=cost,
                population_impact=pop_served,
                cost_per_person=round(cost / pop_served, 2) if pop_served > 0 else 0,
                sustainability_score=candidate["intervention"].sustainability_score,
            )
        )

        remaining -= cost
        allocated_regions[region.id] = allocated_regions.get(region.id, 0) + 1

    return allocations


def _is_coastal(region: Region) -> bool:
    coastal_regions = {
        "mombasa", "dar_es_salaam", "maputo", "lagos", "chittagong",
        "karachi", "mumbai", "chennai", "cox_bazar", "sittwe",
    }
    return region.id.lower().replace("-", "_").replace(" ", "_") in coastal_regions
