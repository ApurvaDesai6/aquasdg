"""
AI Agent endpoint — allows freeform exploration of the data.
Users can ask questions like:
- "Which regions should get priority for $20M in borehole investment?"
- "Compare flood risk across South Asian regions"
- "What's the best intervention for arid regions with high groundwater?"
"""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
import json
import os
import google.generativeai as genai

from ..services.regions import load_all_regions

router = APIRouter(prefix="/api", tags=["agent"])


class AgentQuery(BaseModel):
    question: str
    context_region_id: Optional[str] = None


class AgentResponse(BaseModel):
    answer: str
    data_used: list
    confidence: str


@router.post("/agent/ask", response_model=AgentResponse)
async def agent_ask(query: AgentQuery):
    regions = await load_all_regions()

    context_data = _build_context(regions, query.context_region_id)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return AgentResponse(
            answer="Gemini API key not configured.",
            data_used=[],
            confidence="none",
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are an expert water security analyst with access to real-time data
from the AquaSDG intelligence platform. You have data on {len(regions)} regions across
15 countries covering 278 million people.

DATA CONTEXT:
{context_data}

USER QUESTION: {query.question}

Provide a concise, data-driven answer. Reference specific regions, numbers, and metrics.
If comparing regions, use a structured format. If recommending actions, prioritize by impact.

Respond in JSON format:
{{
  "answer": "Your detailed analysis here (2-4 paragraphs, use specific numbers)",
  "data_used": ["list of data sources referenced"],
  "confidence": "high|medium|low based on data completeness"
}}"""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        result = json.loads(response.text)
        return AgentResponse(**result)
    except Exception as e:
        return AgentResponse(
            answer=f"Analysis error: {str(e)}",
            data_used=[],
            confidence="none",
        )


def _build_context(regions, focus_region_id):
    lines = []

    if focus_region_id:
        r = next((r for r in regions if r.id == focus_region_id), None)
        if r:
            ind = r.indicators
            lines.append(f"FOCUSED REGION: {r.name}, {r.country}")
            lines.append(f"  Population: {r.population:,}")
            lines.append(f"  Risk Level: {r.risk_level.value} (composite: {ind.composite_risk:.3f})")
            lines.append(f"  Water Access: {ind.water_access_pct:.1f}%")
            lines.append(f"  Water Stress: {ind.water_stress:.3f}")
            lines.append(f"  Flood Risk: {ind.flood_risk:.3f}")
            lines.append(f"  Drought Risk: {ind.drought_risk:.3f}")
            lines.append(f"  Precipitation: {ind.precipitation_mm:.0f}mm/yr")
            lines.append(f"  Groundwater Potential: {ind.groundwater_potential:.2f}")
            lines.append(f"  Infrastructure Gap: {ind.infrastructure_gap:.3f}")
            lines.append("")

    lines.append("ALL REGIONS SUMMARY (sorted by risk):")
    sorted_regions = sorted(regions, key=lambda r: -r.indicators.composite_risk)
    for r in sorted_regions:
        ind = r.indicators
        lines.append(
            f"  {r.name:30} | {r.country:12} | risk={ind.composite_risk:.2f} | "
            f"access={ind.water_access_pct:.0f}% | stress={ind.water_stress:.2f} | "
            f"precip={ind.precipitation_mm:.0f}mm | pop={r.population:>10,}"
        )

    lines.append("")
    lines.append("AGGREGATE STATS:")

    by_country = {}
    for r in regions:
        c = r.country
        if c not in by_country:
            by_country[c] = {"pop": 0, "stress_sum": 0, "access_sum": 0, "n": 0}
        by_country[c]["pop"] += r.population
        by_country[c]["stress_sum"] += r.indicators.water_stress
        by_country[c]["access_sum"] += r.indicators.water_access_pct
        by_country[c]["n"] += 1

    for c, d in sorted(by_country.items(), key=lambda x: -x[1]["stress_sum"] / x[1]["n"]):
        lines.append(
            f"  {c:15} | regions={d['n']} | pop={d['pop']:>10,} | "
            f"avg_stress={d['stress_sum']/d['n']:.2f} | avg_access={d['access_sum']/d['n']:.0f}%"
        )

    return "\n".join(lines)
