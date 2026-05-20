from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import Region, RiskLevel
from ..services.regions import load_all_regions, get_region_by_id, get_regions_by_country, get_regions_by_risk
from ..services.classifier import generate_risk_insights
from ..services.interventions import recommend_interventions

router = APIRouter(prefix="/api/regions", tags=["regions"])


@router.get("", response_model=list[Region])
async def list_regions(
    country: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
):
    if country:
        return await get_regions_by_country(country)
    if risk_level:
        return await get_regions_by_risk(risk_level)
    return await load_all_regions()


@router.get("/{region_id}", response_model=Region)
async def get_region(region_id: str):
    region = await get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region


@router.get("/{region_id}/insights")
async def get_region_insights(region_id: str):
    region = await get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    insights = generate_risk_insights(region.indicators)
    return {"region_id": region_id, "insights": insights}


@router.get("/{region_id}/interventions")
async def get_region_interventions(region_id: str):
    region = await get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    coastal_regions = {"mombasa", "lagos-mainland", "dar-es-salaam", "maputo-peri",
                       "nampula", "mumbai-slums", "chennai", "cox-bazar",
                       "karachi-peri", "rakhine", "ayeyarwady-delta", "mogadishu-peri"}
    is_coastal = region.id in coastal_regions

    recs = recommend_interventions(
        region.indicators, region.population, is_coastal=is_coastal
    )
    return {"region_id": region_id, "interventions": recs}
