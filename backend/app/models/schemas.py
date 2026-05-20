from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    critical = "critical"
    high = "high"
    moderate = "moderate"
    low = "low"


class RegionIndicators(BaseModel):
    water_access_pct: float = Field(ge=0, le=100)
    sanitation_pct: float = Field(ge=0, le=100)
    water_stress: float = Field(ge=0, le=1)
    flood_risk: float = Field(ge=0, le=1)
    drought_risk: float = Field(ge=0, le=1)
    climate_vulnerability: float = Field(ge=0, le=1)
    infrastructure_gap: float = Field(ge=0, le=1)
    groundwater_potential: float = Field(ge=0, le=1)
    precipitation_mm: float = Field(ge=0)
    composite_risk: float = Field(ge=0, le=1)


class FloodEvent(BaseModel):
    id: str
    date: str
    severity: float
    area_km2: float
    latitude: float
    longitude: float


class Region(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    population: int
    risk_level: RiskLevel
    indicators: RegionIndicators
    flood_events: List[FloodEvent] = []
    data_sources: List[str] = []


class InterventionType(str, Enum):
    borehole = "borehole"
    rainwater_harvesting = "rainwater_harvesting"
    surface_water_treatment = "surface_water_treatment"
    managed_aquifer_recharge = "managed_aquifer_recharge"
    piped_water_extension = "piped_water_extension"
    desalination = "desalination"


class InterventionRecommendation(BaseModel):
    type: InterventionType
    name: str
    suitability_score: float = Field(ge=0, le=1)
    estimated_cost_usd: float
    population_served: int
    reliability_score: float = Field(ge=0, le=1)
    sustainability_score: float = Field(ge=0, le=1)
    rationale: str


class SimulationRequest(BaseModel):
    budget_usd: float = Field(gt=0)
    time_horizon_years: int = Field(ge=1, le=10, default=3)
    target_regions: Optional[List[str]] = None
    priority: str = Field(default="population", pattern="^(population|cost_effectiveness|sustainability|equity)$")


class RegionAllocation(BaseModel):
    region_id: str
    region_name: str
    country: str
    intervention: str
    allocated_usd: float
    population_impact: int
    cost_per_person: float
    sustainability_score: float


class SimulationResult(BaseModel):
    total_budget: float
    allocated_budget: float
    time_horizon_years: int
    priority: str
    total_population_served: int
    regions_covered: int
    allocations: List[RegionAllocation]
    cost_per_person_avg: float
    sdg6_progress_pct: float


class PolicyRecommendation(BaseModel):
    executive_summary: str
    priority_actions: List[str]
    budget_breakdown: Dict[str, float]
    risk_factors: List[str]
    sdg6_alignment: Dict[str, str]
    implementation_timeline: str
    data_confidence: str
