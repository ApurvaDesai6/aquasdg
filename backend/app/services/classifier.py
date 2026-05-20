"""
Risk classification engine.
Computes composite risk scores from multi-source indicators and classifies
regions into critical/high/moderate/low risk categories.
"""

from ..models.schemas import RiskLevel, RegionIndicators


RISK_WEIGHTS = {
    "water_stress": 0.25,
    "flood_risk": 0.15,
    "drought_risk": 0.15,
    "climate_vulnerability": 0.15,
    "infrastructure_gap": 0.20,
    "water_access_inverse": 0.10,
}


def compute_composite_risk(indicators: dict) -> float:
    water_access_inverse = 1.0 - (indicators.get("water_access_pct", 50) / 100.0)
    values = {
        "water_stress": indicators.get("water_stress", 0.5),
        "flood_risk": indicators.get("flood_risk", 0.3),
        "drought_risk": indicators.get("drought_risk", 0.4),
        "climate_vulnerability": indicators.get("climate_vulnerability", 0.5),
        "infrastructure_gap": indicators.get("infrastructure_gap", 0.5),
        "water_access_inverse": water_access_inverse,
    }
    score = sum(values[k] * RISK_WEIGHTS[k] for k in RISK_WEIGHTS)
    return round(min(1.0, max(0.0, score)), 4)


def classify_risk(composite_risk: float) -> RiskLevel:
    if composite_risk >= 0.7:
        return RiskLevel.critical
    elif composite_risk >= 0.5:
        return RiskLevel.high
    elif composite_risk >= 0.3:
        return RiskLevel.moderate
    return RiskLevel.low


def compute_infrastructure_gap(water_access: float, sanitation: float, population: int) -> float:
    access_gap = 1.0 - (water_access / 100.0)
    sanitation_gap = 1.0 - (sanitation / 100.0)
    pop_factor = min(1.0, population / 50_000_000)
    return round(access_gap * 0.5 + sanitation_gap * 0.3 + pop_factor * 0.2, 4)


def compute_climate_vulnerability(
    flood_risk: float,
    drought_risk: float,
    temp_trend: float,
    precipitation_mm: float,
) -> float:
    precip_stress = 0.0
    if precipitation_mm < 500:
        precip_stress = 1.0 - (precipitation_mm / 500.0)
    elif precipitation_mm > 2000:
        precip_stress = min(1.0, (precipitation_mm - 2000) / 2000.0)

    temp_stress = min(1.0, max(0.0, temp_trend / 2.0))

    return round(
        flood_risk * 0.3 + drought_risk * 0.3 + precip_stress * 0.2 + temp_stress * 0.2,
        4,
    )


def generate_risk_insights(indicators: RegionIndicators) -> list[str]:
    insights = []

    if indicators.water_stress > 0.7:
        insights.append(
            f"Extreme water stress ({indicators.water_stress:.0%}) — demand significantly "
            f"exceeds renewable supply. Immediate supply diversification needed."
        )
    elif indicators.water_stress > 0.4:
        insights.append(
            f"High water stress ({indicators.water_stress:.0%}) — approaching critical "
            f"supply-demand threshold within current climate trajectory."
        )

    if indicators.flood_risk > 0.6:
        insights.append(
            f"Elevated flood exposure ({indicators.flood_risk:.0%}) — infrastructure must "
            f"account for recurring inundation events. MAR systems could convert flood "
            f"surplus to groundwater recharge."
        )

    if indicators.groundwater_potential > 0.6 and indicators.water_stress > 0.5:
        insights.append(
            f"Untapped groundwater potential ({indicators.groundwater_potential:.0%}) "
            f"presents opportunity to reduce surface water dependency through borehole "
            f"programs."
        )

    if indicators.infrastructure_gap > 0.6:
        deficit_pop_pct = indicators.infrastructure_gap * 100
        insights.append(
            f"Infrastructure deficit affecting ~{deficit_pop_pct:.0f}% of service area. "
            f"Priority: extend piped networks in peri-urban zones, boreholes in rural."
        )

    if indicators.drought_risk > 0.5 and indicators.precipitation_mm < 600:
        insights.append(
            f"Low precipitation ({indicators.precipitation_mm:.0f}mm/yr) combined with "
            f"drought risk ({indicators.drought_risk:.0%}) limits rainwater harvesting "
            f"viability — focus on groundwater and water recycling."
        )

    if indicators.water_access_pct < 30:
        insights.append(
            f"Critical access deficit: only {indicators.water_access_pct:.1f}% of "
            f"population has safely managed water. Qualifies for emergency intervention "
            f"under SDG 6.1 accelerated pathway."
        )

    return insights
