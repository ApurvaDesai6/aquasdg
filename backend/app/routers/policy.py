from typing import Optional
from fastapi import APIRouter, HTTPException
from ..models.schemas import PolicyRecommendation, SimulationRequest
from ..services.gemini import generate_policy_recommendation, generate_comparative_analysis
from ..services.regions import load_all_regions, get_region_by_id
from ..services.simulation import run_simulation

router = APIRouter(prefix="/api", tags=["policy"])


@router.post("/recommend/{region_id}", response_model=PolicyRecommendation)
async def recommend_policy(region_id: str, budget_usd: Optional[float] = None):
    region = await get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    simulation = None
    if budget_usd:
        sim_request = SimulationRequest(
            budget_usd=budget_usd,
            target_regions=[region_id],
        )
        regions = await load_all_regions()
        simulation = run_simulation(sim_request, regions)

    recommendation = await generate_policy_recommendation(region, simulation)
    return recommendation


@router.get("/analysis/comparative")
async def comparative_analysis(country: Optional[str] = None):
    regions = await load_all_regions()
    if country:
        regions = [r for r in regions if r.country.lower() == country.lower()]
    analysis = await generate_comparative_analysis(regions)
    return {"analysis": analysis}
