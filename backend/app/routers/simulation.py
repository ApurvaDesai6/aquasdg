from fastapi import APIRouter
from ..models.schemas import SimulationRequest, SimulationResult
from ..services.simulation import run_simulation
from ..services.regions import load_all_regions

router = APIRouter(prefix="/api", tags=["simulation"])


@router.post("/simulate", response_model=SimulationResult)
async def simulate(request: SimulationRequest):
    regions = await load_all_regions()
    result = run_simulation(request, regions)
    return result
