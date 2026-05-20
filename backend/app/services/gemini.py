"""
Gemini LLM integration for policy-grade recommendation synthesis.
Generates structured, actionable recommendations combining ML outputs,
simulation results, and contextual knowledge.
"""

from typing import Optional, List
import json
import os
import google.generativeai as genai
from ..models.schemas import Region, PolicyRecommendation, SimulationResult


def _get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


async def generate_policy_recommendation(
    region: Region,
    simulation: Optional[SimulationResult] = None,
) -> PolicyRecommendation:
    model = _get_model()

    prompt = _build_prompt(region, simulation)

    prompt += """

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "executive_summary": "...",
  "priority_actions": ["action1", "action2", ...],
  "budget_breakdown": {"infrastructure": 60, "capacity_building": 20, "monitoring": 10, "contingency": 10},
  "risk_factors": ["risk1", "risk2", ...],
  "sdg6_alignment": {"6.1": "description", "6.4": "description"},
  "implementation_timeline": "...",
  "data_confidence": "..."
}"""

    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )

    result = json.loads(response.text)
    return PolicyRecommendation(**result)


def _build_prompt(region: Region, simulation: Optional[SimulationResult]) -> str:
    ind = region.indicators
    sim_context = ""
    if simulation:
        sim_context = f"""
SIMULATION RESULTS:
- Budget: ${simulation.total_budget:,.0f} over {simulation.time_horizon_years} years
- Population to be served: {simulation.total_population_served:,}
- Regions covered: {simulation.regions_covered}
- Average cost per person: ${simulation.cost_per_person_avg:.2f}
- SDG 6 progress: {simulation.sdg6_progress_pct:.1f}%
- Priority: {simulation.priority}

Allocations:
{chr(10).join(f"  - {a.region_name}: {a.intervention} (${a.allocated_usd:,.0f}, {a.population_impact:,} people)" for a in simulation.allocations[:10])}
"""

    return f"""You are an expert water policy advisor generating actionable recommendations
for government policymakers and international development organizations.

REGION PROFILE:
- Name: {region.name}, {region.country}
- Population: {region.population:,}
- Risk Level: {region.risk_level.value}
- Water Access: {ind.water_access_pct:.1f}%
- Sanitation Access: {ind.sanitation_pct:.1f}%
- Water Stress Index: {ind.water_stress:.2f} (0-1 scale, >0.4 = high)
- Flood Risk: {ind.flood_risk:.2f}
- Drought Risk: {ind.drought_risk:.2f}
- Climate Vulnerability: {ind.climate_vulnerability:.2f}
- Infrastructure Gap: {ind.infrastructure_gap:.2f}
- Groundwater Potential: {ind.groundwater_potential:.2f}
- Annual Precipitation: {ind.precipitation_mm:.0f}mm
- Composite Risk Score: {ind.composite_risk:.3f}

FLOOD HISTORY:
- {len(region.flood_events)} recorded events
{chr(10).join(f"  - {e.date}: severity {e.severity:.2f}, {e.area_km2:.1f} km²" for e in region.flood_events[:5])}
{sim_context}

Generate a structured policy recommendation that:
1. Synthesizes the data into an actionable executive summary (2-3 sentences)
2. Lists 4-6 priority actions ranked by impact and feasibility
3. Provides a realistic budget breakdown by category (infrastructure, capacity building, monitoring, contingency)
4. Identifies 3-5 key risk factors that could derail implementation
5. Maps actions to specific SDG 6 targets (6.1, 6.2, 6.3, 6.4, 6.5, 6.6)
6. Suggests an implementation timeline (phased approach)
7. Assesses data confidence level (high/medium/low) with explanation

Be specific, data-driven, and actionable. Reference the actual numbers provided.
Avoid generic advice — tailor everything to this region's specific profile."""


async def generate_comparative_analysis(
    regions: List[Region],
) -> str:
    model = _get_model()

    regions_data = []
    for r in regions[:10]:
        regions_data.append({
            "name": f"{r.name}, {r.country}",
            "population": r.population,
            "risk_level": r.risk_level.value,
            "water_access": r.indicators.water_access_pct,
            "water_stress": r.indicators.water_stress,
            "composite_risk": r.indicators.composite_risk,
        })

    prompt = f"""Analyze these water-stressed regions and provide a comparative assessment.
Identify patterns, common challenges, and where shared infrastructure or policy
approaches could yield cross-regional benefits.

Regions:
{json.dumps(regions_data, indent=2)}

Provide:
1. Cross-regional patterns (what do the highest-risk regions share?)
2. Cluster analysis (which regions face similar challenges and could share solutions?)
3. Priority ranking for intervention investment
4. Opportunities for regional cooperation
5. Data gaps that limit analysis confidence

Be concise and data-driven. Reference specific numbers."""

    response = model.generate_content(prompt)
    return response.text
